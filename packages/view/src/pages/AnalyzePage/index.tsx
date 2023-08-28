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
import Skeleton from "@/components/Skeleton";

export default function AnalyzePage() {
  const [searchParams] = useSearchParams();
  const {
    root,
    info,
    depth,
    setRoot,
    setGraphRes,
    rootLoading,
    setRootLoading,
    setSizeLoading,
  } = useStore((state) => state, shallow);
  const svg = useRef(null);
  useEffect(() => {
    if (import.meta.env.VITE_BUILD_MODE == "online") {
      setRootLoading(true);
      setSizeLoading(true);
      setGraphRes(searchParams.get("q") || info, depth).then(() => {
        setRootLoading(false);
        setSizeLoading(false);
      });
    }
  }, [depth, info]);
  useEffect(() => {
    setRoot(null);
  }, [info]);
  if (rootLoading && !root) {
    return <Skeleton></Skeleton>;
  }

  return (
    <main className="w-screen h-screen overflow-hidden  bg-bg-container">
      <div className="fixed">
        <Tree ref={svg}></Tree>
      </div>
      <Sidebar />
      <div className="fixed flex p-5">
        <LanguageIcon />
        <ThemeIcon />
      </div>
      <section
        className="fixed flex left-2rem bottom-2rem gap-4 h-2rem"
        flex="items-end"
      >
        <Depth></Depth>
        <Export
          svgRef={svg}
          width={innerWidth}
          height={innerHeight}
          json={root}
        />
        <Collapse></Collapse>
      </section>
    </main>
  );
}
