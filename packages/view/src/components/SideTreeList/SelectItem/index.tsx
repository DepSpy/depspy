import { useEffect, useState } from "react";
import { Node } from "../../../../types/types";
import { objSame } from "../../../utils/objSame";
import "./index.scss";

interface SelectItemProps {
  node: Node;
  depth: number;
  expandedHandleSet: Set<(flag: boolean) => void>;
  handleNodeClick: (
    node: Node,
    curExpandedHandleSet: Set<(flag: boolean) => void>,
    nodeParents: Set<Node>,
  ) => void;
  selectedNode: Node;
  nodeParents: Set<Node>;
}

export default function SelectItem({
  node,
  depth,
  expandedHandleSet,
  handleNodeClick,
  selectedNode,
  nodeParents,
}: SelectItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const curExpandedHandleSet = new Set(expandedHandleSet);
  const curNodeParents = new Set(nodeParents);
  curExpandedHandleSet.add((flag) => setIsExpanded(flag));
  curNodeParents.add(node);

  useEffect(() => {
    if (objSame(node, selectedNode)) {
      // 将 curExpandedHandleSet 中的所有函数都执行一遍
      curExpandedHandleSet.forEach((handle) => handle(true));
    }
  }, [selectedNode]);

  return (
    <div>
      <div
        className="select-list-item"
        style={{
          backgroundColor: `rgba(156 156, 156, ${1 - depth / 5})`,
          paddingLeft: `${(depth - 1) * 20}px`,
        }}
        onClick={() =>
          handleNodeClick(node, curExpandedHandleSet, curNodeParents)
        }
      >
        <div
          style={
            objSame(node, selectedNode) ? { backgroundColor: "red" } : null
          }
        >
          {depth}-{node.name}
        </div>
        {Object.keys(node.dependencies).length !== 0 ? (
          isExpanded ? (
            <div>收缩</div>
          ) : (
            <div>展开</div>
          )
        ) : null}
      </div>
      {Object.keys(node.dependencies).length > 0
        ? // 遍历 dependencies（对象形式），key 是依赖的名字，value 是依赖的节点
          Object.entries(node.dependencies).map(([key, value]) => (
            <div style={{ display: isExpanded ? "block" : "none" }}>
              <SelectItem
                key={key}
                node={value}
                depth={depth + 1}
                expandedHandleSet={curExpandedHandleSet}
                handleNodeClick={handleNodeClick}
                selectedNode={selectedNode}
                nodeParents={curNodeParents}
              />
            </div>
          ))
        : null}
    </div>
  );
}
