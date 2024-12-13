import { useState } from "react";
import { objSame } from "../../../../utils/objSame";

export default function DrawerItem({ dep, selectedNode, clickHandler }) {
  const [showMore, setShowMore] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      <div
        className={showMore ? "dep-item dep-item-more" : "dep-item"}
        data-more={`${dep.name}@${dep.version}`}
        style={
          objSame(dep, selectedNode ? selectedNode : {})
            ? {
                backgroundColor: "var(--color-primary-base)",
                color: "white",
              }
            : null
        }
        key={dep.name}
        onClick={() => {
          clickHandler(dep);
        }}
        onMouseOver={() => {
          setShowMore(true);
        }}
        onMouseOut={() => {
          setShowMore(false);
        }}
      >
        {dep.name}@{dep.version}
      </div>
    </div>
  );
}
