import { Node } from "../../../../types/types";
// import { objSame } from "../../../utils/objSame";
import DrawerItem from "./DrawerItem";
import "./index.scss";

export default function DrawerBox({
  title,
  dependencies,
  selectedNode,
  setFn,
}) {
  function clickHandler(node) {
    setFn(node);
  }

  return (
    <div
      className="drawer-box"
      style={{
        height: title === "Circular Dependency" ? "10vh" : "30vh",
      }}
    >
      <div className="title">{title}</div>
      <div
        className="content"
        style={{
          height: `calc(${
            title === "Circular Dependency" ? "10vh" : "30vh"
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
