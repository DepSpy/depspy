import { build, Loader } from "esbuild";
import { parse } from "acorn";
import { findSourceToImportsFormAst, normalizeIdToFilePath } from "../utils";
import path from "path";
import {
  parse as vueParse,
  compileScript,
  compileTemplate,
} from "@vue/compiler-sfc";

// 获取指定导出真正依赖的源码和真正依赖的引入（复用vite的treeshaking规范）
export interface GetTreeShakingDetailOptions {
  // vite文件id，可能是绝对路径，也可能是虚拟路径
  entry: string;
  // 源码
  code: string;
  // 指定导出的名称，例如： default ｜ * ｜ getName
  exportName: string;
}
export interface GetTreeShakingDetailResult {
  // treeshaking后的代码
  treeShakingCode: string;
  // 依赖的源码的引入路径和对应引入的变量，例如：{ "./a": ["a","b","default"] }
  sourceToImports: Map<string, Set<string>>;
  // 依赖的动态import的集合，例如：("./a", "./b" , "lodash" )
  dynamicallySource: Set<string>;
}

// 需要处理打包后代码的文件类型
const extToTransformMap = new Map([
  [
    ".vue",
    (code: string) => {
      return code.replace(/"__scopeId", ".*"/, "").replace(/__name: .*,/, "");
    },
  ],
]);
// 通过vite的treeshaking规范获取指定导出真正依赖的源码和真正依赖的引入
export async function getTreeShakingDetail(
  options: GetTreeShakingDetailOptions,
): Promise<GetTreeShakingDetailResult> {
  const { code, exportName, entry } = options;
  // treeshaking后的代码
  let treeShakingCode = "";
  // 源码的引入路径和对应引入的变量，例如：{ "./a": ["a","b","default"] }
  let sourceToImports: Map<string, Set<string>> = new Map();
  // 动态import的集合
  let dynamicallySource = new Set<string>();

  if (code) {
    try {
      // 处理打包后的代码
      treeShakingCode = await getTreeShakingCode(entry, code, exportName);
      // 获取源码的引入路径和对应引入的变量，例如：{ "./a": ["a","b","default"] }
      const {
        sourceToImports: _sourceToImports,
        dynamicallySource: _dynamicallySource,
      } = findSourceToImportsFormAst(
        parse(treeShakingCode, {
          ecmaVersion: "latest",
          sourceType: "module",
        }),
      );
      sourceToImports = _sourceToImports;
      dynamicallySource = _dynamicallySource;
    } catch (e) {
      /* 打包报错有以下原因：直接返回源码
              1. 代码中有语法错误
              2. 代码中有导入不存在的模块
            */
      return {
        treeShakingCode: code,
        sourceToImports,
        dynamicallySource,
      };
    }
  }
  return {
    treeShakingCode,
    sourceToImports,
    dynamicallySource,
  };
}

// 构造导入语句
function constructImportStatement(importedId: string, importName: string) {
  // 处理默认导入
  if (importName === "default") {
    return `import defaultName from '${importedId}';console.log(defaultName);`;
  }
  // 处理命名空间导入
  if (importName === "*") {
    return `import * as all from '${importedId}';console.log(all);`;
  }
  if (importName === "") {
    return `import '${importedId}';`;
  }
  // 处理具名导入
  return `import { ${importName} } from '${importedId}';console.log(${importName});`;
}

// 获取treeShaking后的代码，兼容js，jsx，tsx，ts，vue
async function getTreeShakingCode(
  entry: string,
  code: string,
  exportName: string,
) {
  const ext = path.extname(normalizeIdToFilePath(entry));
  const virtualSourceModuleId = `virtual:source${ext}`;
  const virtualImporterModuleId = `virtual:importer.js`;
  const virtualModules = {
    [virtualSourceModuleId]: code,
    [virtualImporterModuleId]: constructImportStatement(
      virtualSourceModuleId,
      exportName,
    ),
  };
  let bundleCode = "";
  const res = await build({
    entryPoints: [virtualImporterModuleId],
    treeShaking: true,
    bundle: true,
    format: "esm",
    write: false,
    minifyWhitespace: true,
    minifySyntax: true,
    plugins: [
      {
        name: "virtual-bundle",
        setup(build) {
          build.onResolve({ filter: /.+/ }, (args) => {
            if (args.importer === virtualSourceModuleId) {
              return {
                path: args.path,
                namespace: "virtual",
                external: true,
                sideEffects: false,
              };
            }
            return {
              path: args.path,
              namespace: "virtual",
            };
          });
          build.onLoad({ filter: /.+/ }, async (args) => {
            if (args.path === virtualImporterModuleId) {
              return {
                contents: virtualModules[virtualImporterModuleId],
                loader: "js",
              };
            }
            if (args.path === virtualSourceModuleId) {
              // vue文件esbuild不兼容，需要单独处理
              if (ext === ".vue") {
                const { script, template } = compileVueFile(
                  virtualModules[virtualSourceModuleId],
                );
                bundleCode += template;
                return {
                  contents: `${script}`,
                  loader: "js",
                };
              }
              return {
                contents: virtualModules[virtualSourceModuleId],
                loader: ext.replace(".", "") as Loader,
              };
            }
          });
        },
      },
    ],
  });
  // bundleCode不一定符合语法，只用保持依赖字符串的完整性
  bundleCode += res.outputFiles[0].text;
  if (extToTransformMap.has(ext)) {
    return extToTransformMap.get(ext)!(bundleCode || "");
  }
  return bundleCode;
}

// 编译Vue文件
function compileVueFile(source: string) {
  try {
    // 解析Vue单文件组件
    const { descriptor } = vueParse(source);
    const script = compileScript(descriptor, { id: "" });
    const template = compileTemplate({
      source: descriptor.template?.content || "",
      id: "",
      filename: "",
    });
    return {
      script: script.content,
      template: template.code,
    };
  } catch (error) {
    console.error(`编译错误: ${source}`, error);
    return {
      script: "",
      template: "",
    };
  }
}
