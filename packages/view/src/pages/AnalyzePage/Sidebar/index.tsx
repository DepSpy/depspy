import { useEffect, useState } from "react";
import SideTreeList from "../../../components/SideTreeList";
import ChooseItem from "./ChooseItem";
import SideSearch from "../../../components/SideSearch";
import SideModule from "../../../components/SideModule";
import "./index.scss";

export default function Side() {
  const typeList = {
    SEARCH: <SideSearch></SideSearch>,
    GRAPH: <SideTreeList />,
    MODULE: <SideModule></SideModule>,
  };
  const typeName = Object.keys(typeList);

  const [showName, setShowName] = useState(typeName[0]);
  const [showSide, setShowSide] = useState(typeList[showName]);

  useEffect(() => {
    setShowSide(typeList[showName]);
  }, [showName]);

  return (
    <div className="sidebar">
      <ChooseItem
        setShowName={setShowName}
        typeName={typeName}
        showName={showName}
      />
      <div className="sidebar-container">{showSide}</div>
    </div>
  );
}
