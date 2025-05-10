import * as vueCompiler from "@vue/compiler-dom";
import ts from "typescript";

interface GetTreeShakingDetailOptions {
  // vite文件id，可能是绝对路径，也可能是虚拟路径
  entry: string;
  // 源码
  code: string;
  // 指定导出的名称，例如： default ｜ * ｜ getName
  exportName: string;
}
interface GetTreeShakingDetailResult {
  // treeshaking后的代码
  treeShakingCode: string;
  // 依赖的源码的引入路径和对应引入的变量，例如：{ "./a": ["a","b","default"] }
  sourceToImports: Map<string, Set<string>>;
  // 依赖的动态import的集合，例如：("./a", "./b" , "lodash" )
  dynamicallySource: Set<string>;
}

interface ImportInfo {
  identifier: string;
  original: string;
  module: string;
  type: "namespace" | "named" | "default" | "dynamic";
}

/**
 * 格式化表示符
 * @param identifier
 * @param imports 导入信息
 * @param dotIdentifier (例: a.b 中的 "b")
 * @returns {string}
 */
const formatIdentifier = (
  identifier: string,
  imports: ImportInfo[],
  dotIdentifier?: string,
) => {
  const importInfo = imports.find((item) => item.identifier === identifier);

  if (!importInfo) return identifier;

  if (importInfo.type === "default") {
    return `${importInfo.module}@@${importInfo.original}${
      dotIdentifier ? `.${dotIdentifier}` : ""
    }`;
  }

  return `${importInfo.module}@@${importInfo.original}`;
};

/**
 * 获取指定标识的上游依赖
 * @param target
 * @param dependencyList
 * @returns
 */
const getDependency = (target: string, dependencyList: string[][]) => {
  const graph = new Map<string, Set<string>>();
  const visited = new Set<string>();
  const queue: string[] = [];

  // 构建有向图，只有右边的元素依赖左边的元素
  for (const group of dependencyList) {
    const tmp = graph.get(group[0]);
    if (!tmp) {
      graph.set(group[0], new Set(group.slice(1, group.length)));
    } else {
      group.slice(1, group.length).forEach((item) => {
        tmp.add(item);
      });
    }
  }

  // 如果目标在图中，开始BFS
  if (graph.has(target)) {
    queue.push(target);
  }

  // 广度优先搜索
  while (queue.length > 0) {
    const current = queue.shift()!;
    visited.add(current);
    const dependencies = graph.get(current);
    if (dependencies) {
      for (const dependency of dependencies) {
        if (!visited.has(dependency)) {
          queue.push(dependency);
        }
      }
    }
  }

  // 移除目标自身，只返回依赖的字符串
  visited.delete(target);
  return Array.from(visited);
};

export const isFileType = (name: string, type: ".vue" | ".ts") =>
  name.split("?")[0].endsWith(type);

export const parseVueToTs = (vueCode: string) => {
  // 解析vue代码
  const result = vueCompiler.parse(vueCode);
  const children = result.children;

  // 获取script片段
  let tsCode = "";
  children.forEach((element) => {
    //@ts-ignore
    if (element?.tag === "script") {
      //@ts-ignore
      tsCode = element.children[0].content;
    }
  });

  return tsCode;
};

/**
 * 获取所有动态导入
 * @param sourceFile
 * @returns
 */
export function extractDynamicImports(
  sourceFile: ts.SourceFile | ts.Node,
  dynamicImports: ImportInfo[],
) {
  ts.forEachChild(sourceFile, (node) => {
    // 处理动态导入
    if (ts.isCallExpression(node) && node.expression.getText() === "import") {
      const args = node.arguments;
      if (args.length > 0) {
        const moduleSpecifier = args[0];
        dynamicImports.push({
          identifier: "", // 无标识符
          original: "", // 无
          module: moduleSpecifier.getText().replace(/("|')/g, ""),
          type: "dynamic",
        });
      }
    }
    extractDynamicImports(node, dynamicImports);
  });

  return {
    dynamicImports,
  };
}

/**
 * 获取所有导出
 * @param sourceFile
 * @returns
 */
export function extractImports(sourceFile: ts.SourceFile | ts.Node) {
  const imports: ImportInfo[] = [];
  ts.forEachChild(sourceFile, (node) => {
    // 处理普通导入
    if (ts.isImportDeclaration(node) && node.importClause) {
      const moduleSpecifier = node.moduleSpecifier.getText();

      // 默认导入 (import dft from ...)
      if (node.importClause.name) {
        imports.push({
          identifier: node.importClause.name.text,
          original: "default",
          module: moduleSpecifier.replace(/("|')/g, ""),
          type: "default",
        });
      }

      // 命名绑定
      const bindings = node.importClause.namedBindings;

      // 命名空间导入 (import * as ns ...)
      if (bindings && ts.isNamespaceImport(bindings)) {
        imports.push({
          identifier: bindings.name.text,
          original: "*",
          module: moduleSpecifier.replace(/("|')/g, ""),
          type: "namespace",
        });
      }
      // 命名导入 (import { a, b as c })
      if (bindings && ts.isNamedImports(bindings)) {
        bindings.elements.forEach((el) => {
          if (ts.isImportSpecifier(el)) {
            imports.push({
              identifier: el.name.text,
              original: el.propertyName?.text || el.name.text,
              module: moduleSpecifier.replace(/("|')/g, ""),
              type: "named",
            });
          }
        });
      }
    }
    if (ts.isImportDeclaration(node) && !node.importClause) {
      const moduleSpecifier = node.moduleSpecifier.getText();
      imports.push({
        identifier: "",
        original: "",
        module: moduleSpecifier.replace(/("|')/g, ""),
        type: "default",
      });
    }
  });

  const importOriginalMap = new Map<string, Set<string>>();
  imports.forEach((item) => {
    const curOriginalSet = importOriginalMap.get(item.module);
    if (!curOriginalSet) {
      const originalSet = new Set<string>();
      importOriginalMap.set(item.module, originalSet);
      originalSet.add(item.original);
    } else {
      curOriginalSet.add(item.original);
    }
    item.original;
  });

  return {
    importOriginal: Array.from(new Set(imports.map((item) => item.original))),
    importIdentifiers: Array.from(
      new Set(imports.map((item) => item.identifier)),
    ),
    importOriginalMap,
    imports,
  };
}
/**
 * 获取所有导入标识符
 * @param sourceFile
 * @returns
 */
export function extractExports(sourceFile: ts.SourceFile) {
  const exports: string[] = [];
  ts.forEachChild(sourceFile, (node) => {
    // 处理 Export 声明
    if (ts.isExportDeclaration(node)) {
      // 具名导出（如 `export { a, b }`）
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const specifier of node.exportClause.elements) {
          exports.push(specifier.name.text); // 添加导出后的名称（如 `c`）
        }
      }
    }

    // 处理 Export Default 表达式
    if (ts.isExportAssignment(node)) {
      exports.push("default");
    }

    // 处理 Export Default 声明
    if (
      (ts.isVariableStatement(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node)) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
    ) {
      exports.push("default");
    }

    // 处理声明时直接导出（如 `export const x = 1; export function fn() {}`)
    if (
      (ts.isVariableStatement(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node)) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      // VariableStatement -> 变量声明列表
      if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            exports.push(decl.name.text);
          }
        }
      }
      // Function/Class Declaration -> 直接取名称
      else if (node.name) {
        exports.push(node.name.text);
      }
    }
    // 处理默认导出（如 `export default someValue`）
    if (ts.isExportAssignment(node)) {
      if (ts.isIdentifier(node.expression)) {
        exports.push(node.expression.text);
      }
    }
  });
  return Array.from(new Set(exports));
}

/**
 * 获取依赖关系
 * @param node
 * @returns
 *
 * 1. default 引用
 *    import a from 'xx' (influence - a@@xx)
 * 2. alias 引用
 *    import { aa as a2 } from 'xx' (influence - aa@@xx)
 */
export function extractDependencyRelation(node: ts.SourceFile) {
  const exports = extractExports(node);
  const imports = extractImports(node);
  const dynamicImports = extractDynamicImports(node, []);
  const dependencyList: string[][] = [];

  const recur = (
    node: ts.Node,
    depth = 0,
    innerDeclaration = false,
    innerDeclarationIdentifiers: string[] = [],
    deps: string[] = [],
  ) => {
    let curInnerDeclaration = innerDeclaration;

    /**
     * 收集动态导入
     */
    if (ts.isCallExpression(node) && node.expression.getText() === "import") {
      const args = node.arguments;
      if (args.length > 0) {
        const moduleSpecifier = args[0];
        deps.push(
          `${moduleSpecifier.getText().replace(/("|')/g, "")}@@dynamic`,
        );
      }
    }

    /**
     * 收集方法内部的变量声明
     * 在block内部声明的变量记录下来
     */
    if (node.kind === ts.SyntaxKind.Block) {
      curInnerDeclaration = true;
    }
    if (
      node.kind === ts.SyntaxKind.VariableDeclaration &&
      curInnerDeclaration === true
    ) {
      innerDeclarationIdentifiers.push(node.getText().split("=")[0].trim());
      // console.log('innerIdentifier:', innerDeclarationIdentifiers);
    }
    /**
     * 收集依赖关系 - PropertyAccessExpression
     */
    if (node.parent?.kind === ts.SyntaxKind.PropertyAccessExpression) {
      const leftChild = node.parent.getChildAt(0);
      const rightChild = node.parent.getChildAt(2);
      if (leftChild?.kind === ts.SyntaxKind.Identifier) {
        const identifier = leftChild.getText();
        // 在block内部声明的变量，被使用到的话，不能被加入到依赖中
        if (!innerDeclarationIdentifiers.includes(identifier)) {
          deps.push(
            formatIdentifier(identifier, imports.imports, rightChild.getText()),
          );
        }
      }
    }
    /**
     * 收集依赖关系 - 非PropertyAccessExpression
     */
    if (
      node.kind === ts.SyntaxKind.Identifier &&
      node.parent?.kind !== ts.SyntaxKind.PropertyAccessExpression
    ) {
      const identifier = node.getText();

      // 在block内部声明的变量，被使用到的话，不能被加入到依赖中
      if (!innerDeclarationIdentifiers.includes(identifier)) {
        deps.push(formatIdentifier(identifier, imports.imports));
      }
    }

    // 到叶子节点时，收集一波依赖链
    if (!node.getChildCount()) {
      const pre = dependencyList[dependencyList.length - 1];
      // 如果是追加链路，则保留最长链路，踢出短的链路
      if (pre?.length && pre.length < deps.length) {
        dependencyList.pop();
      }
      // 单个deps没有依赖关系，不记录，记录长度>1的依赖关系 + 去重
      if (deps.length > 1 && pre?.join("") !== deps.join("")) {
        dependencyList.push(deps);
      }
      // console.log('deps', deps, node.getEnd(), node.getLastToken());
    }

    let curDeps = [...deps];
    depth++;
    node.getChildren().forEach((c) => {
      const { deps: lastDeps } = recur(
        c,
        depth,
        curInnerDeclaration,
        curInnerDeclaration ? innerDeclarationIdentifiers : [],
        curDeps,
      );
      curDeps = lastDeps;
    });
    return {
      exports,
      imports,
      dynamicImports,
      deps,
      dependencyList,
    };
  };
  return recur(node);
}

/**
 * 查找当前文件影响的指定export的部分
 */
export function findLocalInfluence(
  ast: ts.SourceFile,
  exportIdentifier: string,
): GetTreeShakingDetailResult {
  const { imports, dynamicImports, dependencyList } =
    extractDependencyRelation(ast);

  // console.log(dependencyList);
  // console.log('所有导出: ', exports);
  // console.log('所有导入: ', imports);
  // console.log('所有动态导入: ', dynamicImports);
  // console.log('依赖关系: ', dependencyList);

  // 收到export影响的代码声明
  const dependencyIdentifiers = getDependency(exportIdentifier, dependencyList)
    // 踢出import声明，仅关注当前代码变更带来的影响
    .filter((identifier) => !identifier.includes("@@"));

  let treeShakingCode = "";

  const printer = ts.createPrinter({
    removeComments: true, // 移除注释
    omitTrailingSemicolon: false, // 保持分号一致性
    newLine: ts.NewLineKind.LineFeed,
  });

  const formatNode = (node: ts.Node) => {
    const transformerFactory: ts.TransformerFactory<ts.Node> = (context) => {
      const visitor = (node: ts.Node): ts.Node => {
        node = ts.visitEachChild(node, visitor, context);

        // 处理字符串字面量
        if (ts.isStringLiteralLike(node)) {
          const text = node.text;
          return ts.factory.createStringLiteral(text, true);
        }

        return node;
      };
      return visitor;
    };

    return ts.transform(node, [transformerFactory]).transformed[0];
  };

  ts.forEachChild(ast, (node) => {
    if (
      ts.isVariableStatement(node) ||
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node)
    ) {
      // export本身的表达式也包含进去
      //@ts-ignore
      if (node.name?.text === exportIdentifier) {
        treeShakingCode =
          treeShakingCode +
          printer["printNode"](ts.EmitHint.Unspecified, formatNode(node), ast);
      }
      // VariableStatement -> 变量声明列表
      if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (
            ts.isIdentifier(decl.name) &&
            dependencyIdentifiers.includes(
              formatIdentifier(decl.name.text, imports.imports),
            )
          ) {
            treeShakingCode =
              treeShakingCode +
              printer["printNode"](
                ts.EmitHint.Unspecified,
                formatNode(node),
                ast,
              );
          }
        }
      }
      // Function/Class Declaration -> 直接取名称
      else if (
        node.name &&
        dependencyIdentifiers.includes(
          formatIdentifier(node.name.text, imports.imports),
        )
      ) {
        treeShakingCode =
          treeShakingCode +
          printer["printNode"](ts.EmitHint.Unspecified, formatNode(node), ast);
      }
    }
  });

  // console.log(`影响export(${exportIdentifier})的声明: `, dependencyIdentifiers);

  return {
    treeShakingCode,
    sourceToImports: imports.importOriginalMap,
    dynamicallySource: new Set(
      dynamicImports.dynamicImports.map((item) => item.module),
    ),
  };
}

/**
 * @param options
 * @returns
 */
export const getTreeShakingDetailFromAst = async (
  options: GetTreeShakingDetailOptions,
): Promise<GetTreeShakingDetailResult> => {
  if (isFileType(options.entry, ".ts")) {
    // 获取ts文件ast
    const ast = ts.createSourceFile(
      "",
      options.code,
      ts.ScriptTarget.ESNext,
      true,
    );
    // 受到export影响的代码
    return findLocalInfluence(ast, options.exportName);
  }
  if (isFileType(options.entry, ".vue")) {
    // 解析vue中的ts代码
    const vueCode = parseVueToTs(options.code);
    const ast = ts.createSourceFile("", vueCode, ts.ScriptTarget.ESNext, true);
    // 受到export影响的代码
    return findLocalInfluence(ast, options.exportName);
  }
  return {
    treeShakingCode: options.code,
    sourceToImports: new Map(),
    dynamicallySource: new Set(),
  };
};
