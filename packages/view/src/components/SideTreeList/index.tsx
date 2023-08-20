import SelectedTitle from "./SelectedTitle/index";
import { useStore } from "../../contexts";
import SelectItem from "./SelectItem";
import { objSame } from "../../utils/objSame";
import { Node } from "../../../types/types";
import CoDepList from "./CoDepList/index";
import CircleDepList from "./CircleDepList/index";

export default function TreeSelectedList() {
  const {
    root,
    selectedNode,
    setSelectNode,
    codependency,
    circularDependency,
  } = useStore((state) => state);
  const expandedHandleSet = new Set<(flag: boolean) => void>();
  const nodeParents = new Set<Node>();
  nodeParents.add(root);

  const handleNodeClick = (
    node: Node,
    curExpandedHandleSet: Set<(flag: boolean) => void>,
    nodeParents: Set<Node>,
  ) => {
    // 如果点击的是已经选中的节点，则将自身收缩，父节点展开
    if (objSame(node, selectedNode)) {
      if (objSame(node, root)) return;
      if (Object.keys(node.dependencies).length === 0) return;
      // 将 curExpandedHandleSet 转化为数组，弹出最后一个函数，执行
      Array.from(curExpandedHandleSet).pop()(false);
      // 拿到 Array.from(nodeParents) 的倒数第二个节点
      const parentArray = Array.from(nodeParents);
      setSelectNode(parentArray[parentArray.length - 2]);
      return;
    }
    // 否则，将点击的节点设置为选中节点
    setSelectNode(node);
  };

  return (
    <div className="flex flex-col h-full w-100">
      <SelectedTitle />
      <div
        className="pl-3 pr-3"
        style={{
          height: `${
            100 -
            (codependency && codependency.length ? 25 : 0) +
            (circularDependency && circularDependency.length ? 15 : 0)
          }vh`,
          overflow: "auto",
        }}
      >
        <SelectItem
          node={root}
          depth={1}
          curExpandedHandleSet={expandedHandleSet}
          handleNodeClick={handleNodeClick}
          selectedNode={selectedNode}
          nodeParents={nodeParents}
        />
      </div>
      {codependency && Object.values(codependency)?.length ? (
        <CoDepList />
      ) : null}
      {circularDependency && circularDependency?.length ? (
        <CircleDepList />
      ) : null}
    </div>
  );
}
