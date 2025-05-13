import GridBackground from "@/components/GridBack";
import { GithubIcon, LanguageIcon, ThemeIcon } from "@/components/icon";
import Skeleton from "@/components/Skeleton";
import StaticTree from "@/components/StaticTree";
import { useStaticStore } from "@/contexts";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";

import { handleGraphNodes, renderTreeByGraphId } from "./utils";
import { getStaticGraph } from "@/contexts/api";

export default function StaticAnalyzePage() {
  const {
    staticRootLoading,
    staticRoot,
    staticGraph,
    setStaticGraph,
    setGitChangedNodes,
    setImportChangedNodes,
  } = useStaticStore();

  async function initStaticGraph() {
    const staticGraph = await getStaticGraph();
    const { gitChangeSet, importChangeSet, graph } =
      handleGraphNodes(staticGraph);
    setStaticGraph(graph);
    setGitChangedNodes(gitChangeSet);
    setImportChangedNodes(importChangeSet);
    // 默认渲染第一个节点,等待数据就绪再渲染
    setTimeout(() => {
      renderTreeByGraphId(gitChangeSet.keys().next().value, undefined, true);
    }, 0);
  }

  useEffect(() => {
    initStaticGraph();
  }, []);

  useEffect(() => {
    if (!staticRoot) return;
    if (staticRoot) {
      renderTreeByGraphId(staticRoot.relativeId);
    }
  }, [staticGraph]);

  if (staticRootLoading && !staticGraph) {
    return <Skeleton></Skeleton>;
  }
  return (
    <main className="w-screen h-screen overflow-hidden">
      <div className="fixed">
        <StaticTree />
      </div>
      {/* <div className="fixed left-0 bottom-0">
        <Tool />
      </div> */}
      <div className="fixed -z-50 bg-bg-container">
        <GridBackground></GridBackground>
      </div>
      <Sidebar />
      <div className="fixed flex p-5">
        <LanguageIcon />
        <ThemeIcon />
        <GithubIcon />
      </div>
    </main>
  );
}
