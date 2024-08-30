import { StaticNode } from "@dep-spy/core";
import { useStaticStore, useStore } from "./index";
import { searchNodePath } from "./searchNode";
import type { Node } from "~/types";
import { getNode, updateDepth } from "./api";
export const EventType = {
  init: "init",
  depth: "depth",
};
export const EventBus = {
  init: async ({ depth }) => {
    EventBus.update({ depth: 9 });
    // 初始请求前3层
    const res = await getNode({
      depth: 3,
    });
    console.log(res);

    const { root, circularDependency, codependency } = res.data;
    useStore.setState({ rootLoading: false });
    //连接初始化回调
    useStore.setState({
      root,
      circularDependency,
      codependency,
      selectedNode: root,
      depth,
      selectedNodeHistory: [root],
    });

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
        if (useStore.getState().collapse) {
          const res = await getNode({
            id: newNode.name + newNode.declarationVersion,
            depth: 3,
            path: newNode.path ? newNode.path : "",
          });
          newNode.dependencies = res.data.dependencies;
        }

        useStore.setState({ root: { ...useStore.getState().root } });
      },
    );
  },
  update: async ({ depth, id }: { depth: number; id?: string }) => {
    try {
      await updateDepth({
        depth: depth,
      });
    } catch (error) {
      console.error(`updateDepth ERROR`, error);
    }
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
