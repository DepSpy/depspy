import { StaticTreeNode, StaticGraphNode } from "~/types";
import { SIDE_EFFECT_NAME } from "@dep-spy/core";
import { useStaticStore } from "@/contexts";

//通过完整的路径 rootPath + pathId + '-' + id 截取name
export const extractFileName = (path: string) => {
  // 匹配包含 index 的路径
  const indexRegex = /\/([^/]+)\/index\.([^/]+)(?:-\d+)?$/;
  // 匹配不包含 index 的路径
  const normalRegex = /\/([^/]+)(?:-\d+)?$/;

  if (path.includes("/index.")) {
    const match = path.match(indexRegex);
    if (match) {
      return `${match[1]}/index.${match[2]}`;
    }
  }
  const match = path.match(normalRegex);
  if (match) {
    return match[1];
  }
  return path;
};

export const traverseTree = (
  node: StaticTreeNode,
  callback: (node: StaticTreeNode) => void,
) => {
  callback(node);
  for (const child of Object.values(node.children)) {
    traverseTree(child, callback);
  }
};

// 指定图的节点构建树，reverse 为 true 时，构建反向树
export function renderTreeByGraphId(
  entryId: string,
  selectExports?: Set<string>,
  // 是否反向构建（gitChange -> importChange）
  reverse: boolean = false,
) {
  // 记录当前路径
  const paths = new Set<string>();
  // 记录每一个path出现了多少次
  const idToCount = new Map<string, number>();
  const _buildTreeByGraphId = (
    // 传入根节点id
    entryNode: {
      entryId: string;
      selectExports?: Set<string>;
    },
    // 图节点信息
    graph: Map<string, StaticGraphNode>,
    // 是否反向构建（gitChange -> importChange）
    reverse: boolean = false,
  ) => {
    const { entryId } = entryNode;
    // 记录出现次数
    idToCount.set(entryId, (idToCount.get(entryId) || 0) + 1);
    // 图节点的原始信息
    const graphNode = graph.get(entryId);
    const selectExports =
      entryNode.selectExports ||
      new Set(graphNode.renderedExports.concat(SIDE_EFFECT_NAME));
    // 构建g6渲染的需要的树节点
    const treeNode: StaticTreeNode = {
      ...graphNode,
      id: `${entryId}-${idToCount.get(entryId)}`,
      paths: Array.from(paths),
      children: [],
    };
    if (paths.has(entryId)) {
      // 退出当前path
      paths.delete(entryId);
      return treeNode;
    }
    // 记录当前path
    paths.add(entryId);
    // 需要渲染的子节点集合
    const renderChildren: Map<
      string,
      { entryId: string; selectExports: Set<string> }
    > = new Map();
    // 根据构建方向，赋值对应的子节点
    if (reverse) {
      // 导入该文件的引入者数组，set去重
      new Set([...treeNode.importers, ...treeNode.dynamicImporters]).forEach(
        (childId) => {
          // 引入者导出的变动以及变动原因
          const child = graph.get(childId);
          Object.entries(child.exportEffectedNamesToReasons).forEach(
            ([exportName, reasons]) => {
              // 如果引入者的导出变更和当前文件的变更相关，则添加到子节点进行展示
              reasons.importEffectedNames[entryId]?.forEach((importName) => {
                // 如果该文件选中的导出确实影响到了引入者的导出，则记录影响了引入者的哪些导出，并以此作为影响面向下传递
                if (selectExports.has(importName) || importName === "*") {
                  const children = renderChildren.get(childId);
                  // 已经添加，合并
                  if (children) {
                    children.selectExports.add(exportName);
                    return;
                  }
                  // 未添加，新建
                  renderChildren.set(childId, {
                    entryId: childId,
                    selectExports: new Set([exportName, SIDE_EFFECT_NAME]),
                  });
                }
              });
            },
          );
        },
      );
    } else {
      // 1. 记录该文件选中的导出受到哪些导入以及对应导入的变量的影响，方便第二步过滤不需要展示的子节点
      const importIdToSelectExports = new Map<string, Set<string>>();
      selectExports.forEach((selectExport) => {
        // 选中的export变更的原因
        const reason = treeNode.exportEffectedNamesToReasons[selectExport];
        // 确保reason存在
        if (reason) {
          // 遍历影响该导出的所有导入，并进行合并
          Object.entries(reason.importEffectedNames).forEach(
            ([importId, importNames]) => {
              const childSelectExports = importIdToSelectExports.get(importId);
              // 已经添加，合并
              if (childSelectExports) {
                importIdToSelectExports.set(
                  importId,
                  new Set(Array.from(childSelectExports).concat(importNames)),
                );
                return;
              }
              // 未添加，新建
              importIdToSelectExports.set(importId, new Set(importNames));
            },
          );
        }
      });
      // 2. 该文件的导入文件数组，set去重
      new Set([
        ...treeNode.importedIds,
        ...treeNode.dynamicallyImportedIds,
      ]).forEach((childId) => {
        // 2.1 如果该文件受到了该导入的影响，则需要递归展示
        const childSelectExports = importIdToSelectExports.get(childId);
        if (childSelectExports) {
          renderChildren.set(childId, {
            entryId: childId,
            selectExports: childSelectExports,
          });
          return;
        }
        // 2.2 如果导入的文件有副作用变化，也需要展示
        const child = graph.get(childId);
        if (child.isSideEffectChange) {
          renderChildren.set(childId, {
            entryId: childId,
            // SIDE_EFFECT_NAME代表选中中该节点的副作用
            selectExports: new Set([SIDE_EFFECT_NAME]),
          });
        }
      });
    }
    // 递归构建
    renderChildren.forEach(({ entryId, selectExports }) => {
      treeNode.children.push(
        _buildTreeByGraphId({ entryId, selectExports }, graph, reverse),
      );
    });
    // 退出当前path
    paths.delete(entryId);
    return treeNode;
  };
  const { staticGraph } = useStaticStore.getState();
  const staticTree = _buildTreeByGraphId(
    {
      entryId,
      selectExports,
    },
    staticGraph,
    reverse,
  );
  useStaticStore.setState({ staticRoot: staticTree });
}

// 处理后端发送的原始图节点数据
export const handleGraphNodes = (graphNodes: StaticGraphNode[]) => {
  const graph = new Map<string, StaticGraphNode>();
  const gitChangeSet = new Set<string>();
  const importChangeSet = new Set<string>();
  // 临时记录节点的importers和dynamicImporters
  const idToImporters = new Map<
    string,
    { importers?: Set<string>; dynamicImporters?: Set<string> }
  >();
  graphNodes.forEach((graphNode) => {
    const relativeId = graphNode.relativeId;
    // 1. 记录改节点为引用的importers
    graphNode.importedIds.forEach((childId) => {
      // 已有则添加
      if (idToImporters.has(childId)) {
        idToImporters.get(childId).importers.add(relativeId);
        return;
      }
      // 没有则新建
      idToImporters.set(childId, {
        importers: new Set([relativeId]),
        dynamicImporters: new Set(),
      });
    });
    // 2. 记录改节点为引用的dynamicImporters
    graphNode.dynamicallyImportedIds.forEach((childId) => {
      if (idToImporters.has(childId)) {
        idToImporters.get(childId).dynamicImporters.add(relativeId);
        return;
      }
      // 没有则新建
      idToImporters.set(childId, {
        dynamicImporters: new Set([relativeId]),
        importers: new Set(),
      });
    });
    // 3. 构建新的树节点
    const staticTreeNode = {
      ...graphNode,
      // 复用1，2步骤记录的引入者
      importers: idToImporters.get(relativeId)?.importers || new Set(),
      dynamicImporters:
        idToImporters.get(relativeId)?.dynamicImporters || new Set(),
    };
    // 记录节点信息
    idToImporters.set(graphNode.relativeId, staticTreeNode);
    graph.set(graphNode.relativeId, staticTreeNode);
    // 4. 记录变更文件
    if (graphNode.isGitChange) {
      gitChangeSet.add(graphNode.relativeId);
    }
    // 5. 记录导入变更文件
    if (graphNode.isImportChange) {
      importChangeSet.add(graphNode.relativeId);
    }
  });
  console.log(graph, gitChangeSet);
  return {
    graph,
    gitChangeSet,
    importChangeSet,
  };
};
