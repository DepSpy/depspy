import { useEffect, useState } from "react";
import { Node } from "~/types";
import { objSame } from "@/utils/objSame";
import "./index.scss";

interface SelectItemProps {
  node: Node;
  depth: number;
  curExpandedHandleSet: Set<(flag: boolean) => void>;
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
  curExpandedHandleSet,
  handleNodeClick,
  selectedNode,
  nodeParents,
}: SelectItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  curExpandedHandleSet = new Set(curExpandedHandleSet);
  const curNodeParents = new Set(nodeParents);
  curExpandedHandleSet.add((flag) => setIsExpanded(flag));
  curNodeParents.add(node);

  useEffect(() => {
    if (isExpanded && !selectedNode.path.includes(node.name)) {
      setIsExpanded(false);
    }
    if (objSame(node, selectedNode)) {
      // 将 curExpandedHandleSet 中的所有函数都执行一遍
      curExpandedHandleSet.forEach((handle) => handle(true));
    }
  }, [selectedNode]);

  return (
    <div>
      <div
        className="select-list-item hover:bg-item-bg-hover"
        style={{
          paddingLeft: `0.8rem`,
        }}
        onClick={() =>
          handleNodeClick(node, curExpandedHandleSet, curNodeParents)
        }
      >
        {node &&
        node.dependencies &&
        Object.keys(node.dependencies).length !== 0 ? (
          <div
            className="treelist-selected-arc border-border"
            style={{
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            }}
          ></div>
        ) : (
          <div
            style={{
              marginLeft: "0.8rem",
            }}
          ></div>
        )}
        <div
          className="treelist-selected-name"
          id={node.name + node.version}
          style={
            objSame(node, selectedNode)
              ? { color: "var(--color-primary-base)" }
              : null
          }
        >
          {node.name}@{node.declarationVersion || node.version}
        </div>
      </div>
      {node &&
      node.dependencies &&
      Object.keys(node.dependencies).length > 0 ? (
        <div
          style={{
            marginLeft: `1rem`,
            borderLeft: "1px solid var(--color-border)",
          }}
        >
          {
            // 遍历 dependencies（对象形式），key 是依赖的名字，value 是依赖的节点
            Object.entries(node.dependencies).map(([key, value]) => (
              <div
                style={{
                  display: isExpanded ? "block" : "none",
                }}
              >
                <SelectItem
                  key={key}
                  node={value}
                  depth={depth + 1}
                  curExpandedHandleSet={curExpandedHandleSet}
                  handleNodeClick={handleNodeClick}
                  selectedNode={selectedNode}
                  nodeParents={curNodeParents}
                />
              </div>
            ))
          }
        </div>
      ) : null}
    </div>
  );
}
