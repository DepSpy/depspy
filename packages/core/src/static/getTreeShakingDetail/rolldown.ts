import { build } from "rolldown";
import { DEP_SPY_SUB_START } from "../../constant";
import { findSourceToImportsFormAst, normalizeIdToFilePath } from "../utils";
import path from "path";
import {
  parse as vueParse,
  compileScript,
  compileTemplate,
} from "@vue/compiler-sfc";

// 获取指定导出真正依赖的源码和真正依赖的引入（复用rolldown的treeshaking规范）
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
// 通过rolldown的treeshaking规范获取指定导出真正依赖的源码和真正依赖的引入
export async function getTreeShakingDetail(
  options: GetTreeShakingDetailOptions,
): Promise<GetTreeShakingDetailResult> {
  const { code, exportName, entry } = options;
  // 当前文件的后缀
  const ext = path.extname(normalizeIdToFilePath(entry));
  // 计算过该文件哪些导出受到了影响，直接返回
  const virtualSourceModuleId = `virtual:source${ext}`;
  const virtualImporterModuleId = `virtual:importer.js`;
  const virtualModules = {
    [virtualSourceModuleId]: code,
    [virtualImporterModuleId]: constructImportStatement(
      virtualSourceModuleId,
      exportName,
    ),
  };
  // treeshaking后的代码
  let treeShakingCode = "";
  // 源码的引入路径和对应引入的变量，例如：{ "./a": ["a","b","default"] }
  let sourceToImports = new Map();
  // 动态import的集合
  let dynamicallySource = new Set<string>();

  if (code) {
    try {
      await build({
        input: virtualImporterModuleId,
        plugins: [
          {
            name: "virtual-bundle",
            buildStart() {
              process.env[DEP_SPY_SUB_START] = "true";
            },
            resolveId(id: string, _: string, options: { isEntry: boolean }) {
              // 入口引入直接替换为虚拟模块
              if (options.isEntry) {
                return virtualImporterModuleId;
              }
              // 虚拟模块之间的引入（去除可能存在的查询参数)
              const realId = normalizeIdToFilePath(id);
              if (realId in virtualModules) {
                return id;
              }
              // 目标文件引入的依赖标记为外部依赖，停止解析
              return {
                id,
                external: true,
                moduleSideEffects: true,
              };
            },
            load(id) {
              // 虚拟模块加载逻辑
              if (id in virtualModules) {
                return virtualModules[id];
              }
              return null;
            },
            transform(code, id) {
              // 处理vue文件
              if (id.endsWith(".vue")) {
                return compileVueFile(code);
              }
              return code;
            },
            generateBundle(_, chunk) {
              Object.values(chunk).forEach((module) => {
                // 处理源码，不处理静态资源
                if (module.type === "chunk") {
                  treeShakingCode = module?.code;
                  // 获取源码的引入路径和对应引入的变量，例如：{ "./a": ["a","b","default"] }
                  const {
                    sourceToImports: _sourceToImports,
                    dynamicallySource: _dynamicallySource,
                  } = findSourceToImportsFormAst(
                    this.parse(module?.code || ""),
                  );
                  sourceToImports = _sourceToImports;
                  dynamicallySource = _dynamicallySource;
                }
              });
            },
          },
        ],
      });
    } catch (e) {
      /* 打包报错有以下原因：直接返回源码
        1. 代码中有语法错误
        2. 代码中有导入不存在的模块
      */
      console.log(e);
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

// 编译Vue文件
function compileVueFile(source: string) {
  try {
    // 解析Vue单文件组件
    const { descriptor } = vueParse(source);
    let script = "";
    let template = "";
    let output = "";
    // 处理script
    try {
      script = compileScript(descriptor, { id: "compileVueFile" }).content;
    } catch {
      script = "export default {}";
    }
    // 处理template
    try {
      template = compileTemplate({
        source: descriptor.template?.content || "",
        id: "compileVueFile",
        filename: "compileVueFile",
      }).code;
    } catch (e) {
      template = "";
    }
    // 合并为一个文件
    if (script) {
      output += `${script};`;
    }
    if (template) {
      output += `const template = \`${template}\`;`;
      output += `console.log(template);`;
    }
    return output;
  } catch (error) {
    console.error(`编译错误: ${source}`, error);
    return "";
  }
}
