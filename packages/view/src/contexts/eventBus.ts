import { StaticNode, generateGraph, Graph } from "@dep-spy/core";
import { useStaticStore, useStore } from "./index";
import {
  getDependency,
  getNode,
  getNodeByPath,
  searchNode,
  updateDepth,
} from "./api";
import { Node } from "~/types.ts";
export const EventType = {
  init: "init",
  depth: "depth",
};

let graph: Graph = undefined;

export const enum MODE {
  ONLINE = "online",
  OFFLINE = "offline",
}

const currentMode = import.meta.env.VITE_BUILD_MODE as MODE;

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
  if (!params.length) {
    return;
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

async function getNodesInfo() {
  const treeRoot = await graph.getGraph();

  // 插入双向指针
  await graph.dfs(
    treeRoot,
    () => true,
    async (node) => {
      Object.entries(node.dependencies).forEach(([, child]) => {
        (child as Node).parent = node as unknown as Node;
      });
    },
  );
  const root = treeRoot as Node;
  const circularDependency = (await graph.getCircularDependency()) as Node[];
  const codependency = (await graph.getCodependency()) as Record<
    string,
    Node[]
  >;

  return { root, circularDependency, codependency };
}

export const searchNodes = (key: string) => {
  switch (currentMode) {
    case MODE.OFFLINE: {
      return searchNode({ key });
    }
    case MODE.ONLINE: {
      return graph.searchNodes(key) as Node[];
    }
  }
};

export const EventBus = {
  init: async ({ depth, info }: { depth: number; info?: string }) => {
    useStore.setState({ rootLoading: true });

    switch (currentMode) {
      case MODE.OFFLINE: {
        await EventBus.update({ depth: depth });

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
                id:
                  newNode.path[newNode.path.length - 1] +
                  newNode.declarationVersion,
                depth: 3,
                path: newNode.path ? newNode.path : undefined,
              });
              newNode.dependencies = res.data.dependencies;
            }

            useStore.setState({ root: { ...root } });
          },
        );
        break;
      }
      case MODE.ONLINE: {
        graph = generateGraph(info, { depth });
        await graph.ensureGraph();

        const { root, circularDependency, codependency } = await getNodesInfo();

        useStore.setState({
          root,
          circularDependency,
          codependency,
          selectedNode: root,
          depth,
          selectedNodeHistory: [root],
        });
        break;
      }
    }
    useStore.setState({ rootLoading: false });

    useStore.subscribe(
      (state) => state.depth,
      (newDepth) => {
        EventBus.update({ depth: newDepth });
      },
    );
  },
  update: async ({ depth }: { depth: number; id?: string }) => {
    useStore.setState({ rootLoading: true });
    try {
      switch (currentMode) {
        case MODE.OFFLINE: {
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

          useStore.setState({
            root,
            circularDependency,
            codependency,
            selectedNode: root,
            depth,
            selectedNodeHistory: [root],
            collapse: true,
          });
          break;
        }
        case MODE.ONLINE: {
          await graph.update(depth);

          const { root, circularDependency, codependency } =
            await getNodesInfo();

          useStore.setState({
            root,
            circularDependency,
            codependency,
            selectedNode: root,
            depth,
            selectedNodeHistory: [root],
            collapse: true,
          });
          break;
        }
      }
    } catch (error) {
      console.error(`updateDepth ERROR`, error);
    }
    useStore.setState({ rootLoading: false });
  },
  initStatic: (staticRoot: StaticNode) => {
    useStaticStore.setState({ staticRoot, staticRootLoading: false });
  },
};
