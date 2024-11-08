import { StaticNode } from "@dep-spy/core";
import { useStaticStore, useStore } from "./index";
import { searchNodePath } from "./searchNode";
import { getDependency, getNode, getNodeByPath, updateDepth } from "./api";
export const EventType = {
  init: "init",
  depth: "depth",
};

export async function getNodeByPaths(curRoot, paths: string[][]) {
  const params = [];
  for (const path of paths) {
    const finalNode = findFinalNode(curRoot, path);
    if (finalNode) {
      params.push({
        start: finalNode.finalNodeParentName,
        path: path,
      });
    }
  }
  const res = await getNodeByPath({
    pathList: params,
  });
  const { data } = res;
  data.forEach((item) => {
    const finalNode = findFinalNode(curRoot, item.path, true);

    finalNode.finalNode.parent.dependencies[item.path[item.path.length - 1]] =
      item;
    item.parent = finalNode.finalNode.parent;
  });

  // if (!isExistDepByPath(root, paths)) {
  //   console.error("getNodeByPaths error");
  // }
}

function findFinalNode(root, paths: string[], byPath: boolean = false) {
  let curRoot = root;
  let prePath = "";
  for (const path of paths.slice(1)) {
    if (curRoot && (!curRoot.dependencies || !curRoot.dependencies[path])) {
      // const res = await getNodeByPath({
      //   name: prePath,
      //   path: paths,
      // });

      // curRoot.parent.dependencies[prePath] = res.data || {};
      // curRoot.parent.dependencies[prePath].parent = curRoot;
      return {
        finalNode: curRoot,
        finalNodeName: path,
        finalNodeParentName: prePath,
        finalNodeParent: curRoot.parent,
        path: curRoot.path,
      };
    }
    curRoot = curRoot && curRoot.dependencies ? curRoot.dependencies[path] : {};
    prePath = path;
  }
  if (byPath) {
    return {
      finalNode: curRoot,
    };
  }
  return null;
}

export const EventBus = {
  init: async ({ depth }) => {
    EventBus.update({ depth: depth });
    useStore.subscribe(
      (state) => state.depth,
      (newDepth) => {
        EventBus.update({ depth: newDepth });
      },
    );
    // 当用户选择节点时进行更新，预加载下面两层
    useStore.subscribe(
      (state) => state.selectedNode,
      async (newNode) => {
        const { collapse, root } = useStore.getState();

        if (
          collapse &&
          newNode.name + newNode.declarationVersion !==
            root.name + root.declarationVersion
        ) {
          const res = await getNode({
            id: newNode.name + newNode.declarationVersion,
            depth: 3,
            path: newNode.path ? newNode.path : "",
          });
          newNode.dependencies = res.data.dependencies;
        }

        useStore.setState({ root: { ...root } });
      },
    );
  },
  update: async ({ depth }: { depth: number; id?: string }) => {
    try {
      await updateDepth({
        depth: depth,
      });
      // 初始请求前3层
      const res = await getNode({
        depth: 3,
      });
      const depRes = await getDependency();
      const { codependency, circularDependency } = depRes.data;

      const root = res.data;
      console.log("全局初始数据", root);

      useStore.setState({ rootLoading: false });
      //连接初始化回调
      useStore.setState({
        root,
        circularDependency,
        codependency,
        selectedNode: root,
        depth,
        selectedNodeHistory: [root],
        collapse: true,
      });
    } catch (error) {
      console.error(`updateDepth ERROR`, error);
    }
    useStore.setState({ rootLoading: false });
  },
  initStatic: (staticRoot: StaticNode) => {
    useStaticStore.setState({ staticRoot, staticRootLoading: false });
  },
  depth: ({ root, circularDependency, codependency }) => {
    useStore.setState({ rootLoading: false });
    // 更新 depth 回调
    // 找到新 tree 中的 selectedNode
    const { selectedNode } = useStore.getState();
    const tempNode = searchNodePath(root, selectedNode.path);
    useStore.setState({
      root,
      circularDependency,
      codependency,
      selectedNode: tempNode,
    });
  },
};
