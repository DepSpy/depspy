import SidebarButton from "../components/SidebarButton";
import { useStaticStore } from "@/contexts";
import { useEffect, useMemo, useState, useCallback } from "react";
import { shallow } from "zustand/shallow";
import { extractFileName, renderTreeByGraphId } from "../../utils";
import useLanguage from "@/i18n/hooks/useLanguage";
export const Global = () => {
  const [activeTab, setActiveTab] = useState<"git" | "import">("git");
  const { gitChangedNodes, importChangedNodes, setHighlightedNodeIds } =
    useStaticStore(
      (state) => ({
        gitChangedNodes: state.gitChangedNodes,
        importChangedNodes: state.importChangedNodes,
        setHighlightedNodeIds: state.setHighlightedNodeIds,
      }),
      shallow,
    );
  const { t } = useLanguage();


  const gitFileList = useMemo(() => {
    return Array.from(gitChangedNodes.keys()).map((item) => (
      <div
        key={item}
        className="p-2 hover:bg-gray-100 rounded hover:text-blue-500 min-w-80 cursor-pointer"
        data-path={item}
      >
        📄 {extractFileName(item)}
      </div>
    ));
  }, [gitChangedNodes]);

  const importFileList = useMemo(() => {
    return Array.from(importChangedNodes.keys()).map((item) => (
      <div
        key={item}
        className="p-2 hover:bg-gray-100 rounded hover:text-blue-500 min-w-80 cursor-pointer"
        data-path={item}
      >
        ⚡ {extractFileName(item)}
      </div>
    ));
  }, [importChangedNodes]);

  const totalCount = useMemo(() => {
    return activeTab === "git" ? gitChangedNodes.size : importChangedNodes.size;
  }, [activeTab, gitChangedNodes.size, importChangedNodes.size]);

  const handleFileListClick = useCallback(
    (e) => {
      const path = e.target.dataset.path || "";
      if (!path) return;
      if (activeTab === "git") {
        renderTreeByGraphId(path,undefined,true)
        // setHighlightedNodeIds(new Set(gitChangedNodes.get(path)));
      } else if (activeTab === "import") {
        renderTreeByGraphId(path)
        // setHighlightedNodeIds(new Set(importChangedNodes.get(path)));
      }
    },
    [gitChangedNodes, importChangedNodes, activeTab, setHighlightedNodeIds],
  );

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

      <div className="flex-1 overflow-auto p-4" onClick={handleFileListClick}>
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
