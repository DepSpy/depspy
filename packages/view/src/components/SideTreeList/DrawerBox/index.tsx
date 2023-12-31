import { Node } from "../../../../types/types";
import { objSame } from "../../../utils/objSame";
import DrawerItem from "./DrawerItem";
import "./index.scss";
import useLanguage from "../../../i18n/hooks/useLanguage";

export default function DrawerBox({
  title,
  dependencies,
  selectedNode,
  setFn,
}) {
  function clickHandler(node) {
    if (objSame(node, selectedNode || {})) {
      setFn(null);
    } else {
      setFn(node);
    }
  }

  const { t } = useLanguage();

  return (
    <div
      className="drawer-box"
      style={{
        height: title === "Circular Dependency" ? "15vh" : "25vh",
      }}
    >
      <div className="title">
        {title === "Circular Dependency"
          ? t("aside.list.circular")
          : t("aside.list.duplicated")}
      </div>
      <div
        className="content"
        style={{
          height: `calc(${
            title === "Circular Dependency" ? "15vh" : "25vh"
          } - 3rem)`,
        }}
      >
        {dependencies
          ? dependencies.map((dep: Node) => (
              <DrawerItem
                dep={dep}
                selectedNode={selectedNode}
                clickHandler={clickHandler}
              ></DrawerItem>
            ))
          : null}
      </div>
    </div>
  );
}
