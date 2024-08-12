import { StaticNode } from "@dep-spy/core";
import { useStaticStore, useStore } from "./index";
import { searchNodePath } from "./searchNode";
import { updateDepth } from "./api";
export const EventType = {
  init: "init",
  depth: "depth",
};
export const EventBus = {
  init: ({ root, circularDependency, codependency, depth }) => {
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
      async (newDepth) => {
        console.log(newDepth, 'newDepth');
        
        await updateDepth({
          depth: newDepth
        });

      },
    );
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
