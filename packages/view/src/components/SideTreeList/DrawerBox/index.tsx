import { Node } from "../../../../types/types";
import { objSame } from "../../../utils/objSame";
import DrawerItem from "./DrawerItem";
import "./index.scss";

export default function DrawerBox({
  title,
  dependencies,
  selectedNode,
  setFn,
}) {
  function clickHandler(node) {
    if (objSame(node, selectedNode || {})) {
      setFn(null);
      return;
    }
    setFn(node);
  }

  return (
    <div
      className="drawer-box"
      style={{
        height: title === "Circular Dependency" ? "15vh" : "25vh",
      }}
    >
      <div className="title">{title}</div>
      <div
        className="content"
        style={{
          height: `calc(${
            title === "Circular Dependency" ? "15vh" : "25vh"
          } - 3rem)`,
        }}
      >
        {dependencies
          ? dependencies.map((dep: Node) =>
              DrawerItem({ dep, selectedNode, clickHandler }),
            )
          : null}
      </div>
    </div>
  );
}
