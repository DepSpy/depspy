import { useEffect, useState } from "react";
import SideTreeList from "../../../components/SideTreeList";
import ChooseItem from "./ChooseItem";
import SideSearch from "../../../components/SideSearch";
import SideModule from "../../../components/SideModule";
import "./index.scss";
import useLanguage from "../../../i18n/hooks/useLanguage";

export default function Side() {
  const { t } = useLanguage();
  const typeList = {
    [t("aside.search.title")]: <SideSearch></SideSearch>,
    [t("aside.list.title")]: <SideTreeList />,
    [t("aside.module.title")]: <SideModule></SideModule>,
  };

  // 获取 typeList 的属性名
  const typeName = Object.keys(typeList);

  const [showName, setShowName] = useState(typeName[1]);
  const [showSide, setShowSide] = useState(typeList[showName]);
  const [showSideAll, setShowSideAll] = useState(true);

  useEffect(() => {
    setShowSide(typeList[showName]);
  }, [showName]);

  return (
    <div
      className="sidebar border-l-solid border-l-border bg-bg-container text-text"
      style={{
        transform: `translateX(${showSideAll ? "0" : "25rem"})`,
        transition: "transform 0.5s",
      }}
    >
      <ChooseItem
        setShowName={setShowName}
        typeName={typeName}
        showName={showName}
        setShowSideAll={setShowSideAll}
        showSideAll={showSideAll}
      />
      <div className="sidebar-container">{showSide}</div>
    </div>
  );
}
