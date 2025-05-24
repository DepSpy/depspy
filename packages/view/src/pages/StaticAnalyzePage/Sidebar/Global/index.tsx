import "./index.scss";
import SidebarButton from "../components/SidebarButton";
import { useStaticStore } from "@/contexts";
import { useMemo, useState, useCallback } from "react";
import { shallow } from "zustand/shallow";
import { renderTreeByGraphId } from "../../utils";
import useLanguage from "@/i18n/hooks/useLanguage";

export const Global = () => {
  const [activeTab, setActiveTab] = useState<"git" | "import">("git");
  const { gitChangedNodes, importChangedNodes, setHighlightedNodeIds } =
    useStaticStore(
      (state) => ({
        staticGraph: state.staticGraph,
        gitChangedNodes: state.gitChangedNodes,
        importChangedNodes: state.importChangedNodes,
        setHighlightedNodeIds: state.setHighlightedNodeIds,
      }),
      shallow,
    );
  const { t } = useLanguage();
  const handleFileListClick = useCallback(
    (e) => {
      console.log("handleFileListClick", e.target.dataset);
      const path = e.target.dataset.path || "";
      if (!path) return;
      if (activeTab === "git") {
        renderTreeByGraphId(path, undefined, true);
        // setHighlightedNodeIds(new Set(gitChangedNodes.get(path)));
      } else if (activeTab === "import") {
        renderTreeByGraphId(path);
        // setHighlightedNodeIds(new Set(importChangedNodes.get(path)));
      }
    },
    [gitChangedNodes, importChangedNodes, activeTab, setHighlightedNodeIds],
  );

  const gitFileList = useMemo(() => {
    return Array.from(gitChangedNodes.keys()).map((item) => {
      const itemTrees = item.split("/").filter(Boolean);

      return itemTrees.map((itemTree, index) => (
        <div
          key={itemTree}
          style={{
            paddingLeft: `${(index + 1) * 8}px`,
            display: "flex",
            alignItems: "center",
          }}
          className="group hover:bg-gray-100 rounded hover:text-blue-500 min-w-80"
        >
          {index === itemTrees.length - 1 ? (
            <div className="flex items-center" onClick={handleFileListClick}>
              <div data-path={item} className="cursor-pointer ml-1 w-full">
                📄{itemTree}
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="treelist-selected group-hover:border-l-black"></div>
              <div className="ml-1">{itemTree}</div>
            </div>
          )}
        </div>
      ));
    });
  }, [gitChangedNodes]);

  const importFileList = useMemo(() => {
    return Array.from(importChangedNodes.keys()).map((item) => {
      const itemTrees = item.split("/").filter(Boolean);
      return itemTrees.map((itemTree, index) => (
        <div
          data-path={item}
          key={itemTree}
          style={{
            paddingLeft: `${(index + 1) * 8}px`,
            display: "flex",
            alignItems: "center",
          }}
          className="group hover:bg-gray-100 rounded hover:text-blue-500 min-w-80"
        >
          {index === itemTrees.length - 1 ? (
            <div className="flex items-center" onClick={handleFileListClick}>
              <div data-path={item} className="cursor-pointer ml-1 w-full">
                ⚡{itemTree}
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="treelist-selected group-hover:border-l-black"></div>
              <div className="ml-1" data-path={item}>
                {itemTree}
              </div>
            </div>
          )}
        </div>
      ));
    });
  }, [importChangedNodes]);

  const totalCount = useMemo(() => {
    return activeTab === "git" ? gitChangedNodes.size : importChangedNodes.size;
  }, [activeTab, gitChangedNodes.size, importChangedNodes.size]);

  return (
    <div className="h-full flex flex-col">
      <header className="flex gap-2 p-2 border-b">
        <SidebarButton onClick={() => setActiveTab("git")}>
          {/* Git 变更 */}
          {t("static.gitChanged")}
        </SidebarButton>

        <SidebarButton onClick={() => setActiveTab("import")}>
          {/* 导入变更 */}
          {t("static.importChanged")}
        </SidebarButton>
      </header>

      <div className="p-4 font-bold border-b min-w-40">
        {/* 当前数量 */}
        {t("static.sidebar.global.count")}：
        <span className="text-[var(--color-primary-text)]">{totalCount}</span>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === "git" && (
          <div className="space-y-2">
            {gitFileList.length > 0 ? (
              gitFileList
            ) : (
              <div className="text-gray-400 p-4 text-center">
                {/* 暂无 Git 变动文件 */}
                {t("static.sidebar.global.noGit")}
              </div>
            )}
          </div>
        )}

        {activeTab === "import" && (
          <div className="space-y-2">
            {importFileList.length > 0 ? (
              importFileList
            ) : (
              <div className="text-gray-400 p-4 text-center">
                {/* 暂无受影响文件 */}
                {t("static.sidebar.global.noImport")}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
