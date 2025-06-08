import GridBackground from "@/components/GridBack";
import { GithubIcon, LanguageIcon, ThemeIcon } from "@/components/icon";
import Skeleton from "@/components/Skeleton";
import StaticTree from "@/components/StaticTree";
import { useStaticStore, useStore } from "@/contexts";
import { useEffect, useMemo } from "react";
import { handleGraphNodes, renderTreeByGraphId } from "./utils";
import { getStaticGraph } from "@/contexts/api";
import DiffPannel from "@/components/DiffPanel";
import { ConfigProvider, Splitter,theme as antTheme  } from "antd";
import { Selected } from "./Sidebar/Selected";
import { Global } from "./Sidebar/Global";
import "./index.scss";

export default function StaticAnalyzePage() {
  const {
    staticRootLoading,
    staticRoot,
    staticGraph,
    highlightedNodeId,
    fullscreen,
    setStaticGraph,
    setGitChangedNodes,
    setImportChangedNodes,
  } = useStaticStore();
  const theme = useStore((state) => state.theme);
  const selectNodeInfo = useMemo(() => {
    const entryId = highlightedNodeId.split("-")[0];
    return staticGraph?.get(entryId)
  }, [highlightedNodeId, staticGraph]);

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
    <ConfigProvider
      theme={{
        algorithm: theme === "dark" ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        components: {
          Splitter: {
            splitBarDraggableSize:40,
            splitBarSize:4
          },
        },
      }}
    >
      <main className="w-screen h-screen overflow-hidden bg-bgContainer">
        <Splitter className="w-full h-full">
          <Splitter.Panel collapsible defaultSize="20%" min="20%" max="40%">
            <Global />
          </Splitter.Panel>
          <Splitter.Panel>
            <Splitter layout="vertical" >
              <Splitter.Panel defaultSize="80%">
                <div className="w-full h-full overflow-y-auto scroll-bar bg-bgLayout">
                  {
                    fullscreen && selectNodeInfo.curCode ? (
                      <div className="h-">
                        <DiffPannel
                          preCode={selectNodeInfo.preCode}
                          curCode={selectNodeInfo.curCode}
                          splitView
                          hideLineNumbers={false}
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-0 right-0 z-1">
                          <StaticTree />
                        </div>
                        <div className="absolute">
                          <GridBackground></GridBackground>
                        </div>
                      </div>)
                  }
                </div>
              </Splitter.Panel>
              <Splitter.Panel collapsible>
                <div className="w-full h-full pt-1 overflow-y-auto scroll-bar bg-bgLayout">
                  <Selected />
                </div>
              </Splitter.Panel>
            </Splitter>
          </Splitter.Panel>
        </Splitter>

        <div className="fixed right-0 top-0 z-10 flex p-5">
          <LanguageIcon />
          <ThemeIcon />
          <GithubIcon />
        </div>
      </main>
    </ConfigProvider>
  );
}
