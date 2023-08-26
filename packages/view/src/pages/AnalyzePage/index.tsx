import Tree from "@/components/Tree";
import { useStore } from "@/contexts";
import Sidebar from "./Sidebar";
import Depth from "@/components/Depth";
import Collapse from "@/components/Collapse";
import { Export } from "@/components/Export";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { shallow } from "zustand/shallow";
import { LanguageIcon, ThemeIcon } from "../../components/icon/index";
import Skeleton from "@/components/Skeleton";
export default function AnalyzePage() {
  const [searchParams] = useSearchParams();
  const { root, info, depth, setGraphRes, setPreSelectNode } = useStore(
    (state) => state,
    shallow,
  );
  const svg = useRef(null);
  const [isLoading, setLoading] = useState(false);
  useEffect(() => {
    if (import.meta.env.VITE_BUILD_MODE == "online") {
      setLoading(true);
      setGraphRes(searchParams.get("q") || info, depth).then(() => {
        setLoading(false);
      });
    }
  }, [depth, info]);
  if (isLoading || !root) {
    return <Skeleton></Skeleton>;
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
        <div
          className="absolute flex right-105 top-5
           z-10 p-2 w-15 h-15
           bg-bg-container
           border border-solid border-border rounded-full hover:border-primary-base"
          onClick={() => {
            setPreSelectNode();
          }}
        >
          <div className="i-carbon-direction-loop-left w-full h-full text-icon"></div>
        </div>
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
    </>
  );
}
