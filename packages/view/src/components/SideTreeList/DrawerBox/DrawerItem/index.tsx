import { useState } from "react";
import { objSame } from "../../../../utils/objSame";
import "./index.scss";

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
        className="dep-item"
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
      {showMore ? (
        <div className="dep-item-more">
          {dep.name}@{dep.version}
        </div>
      ) : null}
    </div>
  );
}
