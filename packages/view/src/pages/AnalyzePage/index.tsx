import Tree from "@/components/Tree";
import { useStore } from "@/contexts";
import Sidebar from "./Sidebar";
import Depth from "@/components/Depth";
import Collapse from "@/components/Collapse";
import { Export } from "@/components/Export";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { shallow } from "zustand/shallow";
import { LanguageIcon, ThemeIcon } from "../../components/icon/index";
export default function AnalyzePage() {
  const [searchParams] = useSearchParams();
  const { root, info, depth, setGraphRes } = useStore(
    (state) => state,
    shallow,
  );
  const svg = useRef(null);
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
      <div className="fixed flex p-5">
        <LanguageIcon />
        <ThemeIcon />
      </div>
      <div className="flex h-screen overflow-hidden bg-bg-container">
        <Tree ref={svg}></Tree>
        <Sidebar />
      </div>
      <section
        className="fixed flex left-2rem bottom-2rem gap-4 h-2rem"
        flex="items-end"
      >
        <Depth></Depth>
        <Collapse></Collapse>
        <Export
          svgRef={svg}
          width={innerWidth}
          height={innerHeight}
          json={root}
        />
      </section>
    </>
  );
}
