import Tree from "@/components/Tree";
import { useStore } from "../../contexts";
import Sidebar from "./Sidebar";
import Depth from "@/components/Depth";
import Collapse from "@/components/Collapse";
import useLanguage from "../../i18n/hooks/useLanguage";
// import { Export } from "@/components/Export";
import { useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";

export default function AnalyzePage() {
  let searchname: string;
  let json: string;
  const { URLSearchname } = useParams();
  const location = useLocation();
  if (location.state && location.state.json && location.state.searchname) {
    window.history.replaceState(null, "", `${window.location.pathname}`);
    searchname = location.state.searchname;
    json = location.state.json;
  }

  const root = useStore((state) => state.root);
  const { theme, setTheme } = useStore();
  const { t, toggleLanguage } = useLanguage();
  const svg = useRef(null);
  const toggleMode = () => {
    setTheme(theme);
  };

  useEffect(() => {
    console.log("url", URLSearchname);
    console.log("searchname", searchname);
    console.log("json", json);
  }, [URLSearchname, json]);

  if (!root) {
    return <>loading</>;
  }
  return (
    <>
      <div className="fixed">
        <button onClick={toggleLanguage}>切换语言</button>
        <button onClick={toggleMode}>切换模式</button>
        <p className={`bg-primary-bg c-text`}>{t("section.depth")}</p>
      </div>
      <div className="flex h-screen overflow-hidden">
        <Tree originalData={root} ref={svg}></Tree>
        <Sidebar />
      </div>
      <section
        className="fixed flex left-2rem bottom-2rem gap-4 h-2rem"
        flex="items-end"
      >
        <Depth></Depth>
        <Collapse></Collapse>
        {/* <Export
          svgRef={svg}
          width={innerWidth}
          height={innerHeight}
          ZOOM={{ k: 0.5 }}
        ></Export> */}
      </section>
    </>
  );
}
