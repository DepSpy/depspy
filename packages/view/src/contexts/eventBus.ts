import { StaticNode } from "@dep-spy/core";
import { useStaticStore, useStore } from "./index";
import { searchNodePath } from "./searchNode";
import { getNode, updateDepth } from "./api";
export const EventType = {
  init: "init",
  depth: "depth",
};
export const EventBus = {
  init: async ({ depth }) => {
    EventBus.update({  depth: 3 });
    const { root, circularDependency, codependency } = await getNode({
      depth: 3,
    });
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
        EventBus.update({  depth: newDepth });
      },
    );
    useStore.subscribe((state) => state.selectedNode, async (newNode) => {
      console.log(newNode, '11');
      const res = await getNode({
        id: newNode.name + newNode.declarationVersion,
        depth: newNode.path.length + 2,
      })
      console.log(res);
      
    })
  },
  update: async ({ depth, id }: {depth: number, id?: string}) => {
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
