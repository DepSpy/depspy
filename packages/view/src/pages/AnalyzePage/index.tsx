import Tree from "@/components/Tree";
import { useStore } from "@/contexts";
import Sidebar from "./Sidebar";
import Depth from "@/components/Depth";
import Collapse from "@/components/Collapse";
import useLanguage from "../../i18n/hooks/useLanguage";
// import { Export } from "@/components/Export";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { shallow } from "zustand/shallow";
export default function AnalyzePage() {
  const [searchParams] = useSearchParams();
  const { root, theme, setTheme, info, depth, setGraphRes } = useStore(
    (state) => ({
      root: state.root,
      theme: state.theme,
      info: state.info,
      depth: state.depth,
      setTheme: state.setTheme,
      setGraphRes: state.setGraphRes,
    }),
    shallow,
  );
  const { t, toggleLanguage } = useLanguage();
  const svg = useRef(null);
  const toggleMode = () => {
    setTheme(theme);
  };

  useEffect(() => {
    if (import.meta.env.VITE_BUILD_MODE == "online") {
      setGraphRes(searchParams.get("q") || info, depth);
    }
  }, [depth, info]);

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
        <Tree ref={svg}></Tree>
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
