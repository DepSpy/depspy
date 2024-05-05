import { useStore } from "./index";
import { searchNodePath } from "./searchNode";
export const EventType = {
  init: "init",
  depth: "depth",
  size: "size",
};
export const EventBus = {
  init: ({ root, circularDependency, codependency, depth }, ws) => {
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
        ws.send(JSON.stringify({ type: "depth", newDepth }));
      },
    );
    //初始化后需要获取size
    ws.send(JSON.stringify({ type: "size", newDepth: depth }));
  },
  depth: ({ root, circularDependency, codependency }, ws) => {
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
    // 清空 selectedSizeNode
    useStore.setState({ selectedSizeNode: null });
    // 更新完 depth 后，需要重新获取 size
    const { depth } = useStore.getState();
    ws.send(JSON.stringify({ type: "size", newDepth: depth }));
  },
  size: ({ root, circularDependency, codependency }) => {
    useStore.setState({ sizeLoading: false });
    // 更新 size 回调
    const { selectedNode } = useStore.getState();
    const tempNode = searchNodePath(root, selectedNode.path);
    useStore.setState({
      sizeRoot: root,
      selectedSizeNode: tempNode,
      circularDependency,
      codependency,
    });
  },
};
