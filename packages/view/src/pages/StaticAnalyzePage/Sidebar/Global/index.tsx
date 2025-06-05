import SidebarButton from "../components/SidebarButton";
import { useStaticStore } from "@/contexts";
import { useMemo, useState, useCallback } from "react";
import { shallow } from "zustand/shallow";
import { renderTreeByGraphId } from "../../utils";
import useLanguage from "@/i18n/hooks/useLanguage";
import { Tree } from "react-arborist";
import { NodeRendererProps } from "react-arborist";

export const Global = () => {
  interface TreeNodeType {
    id: string;
    name: string;
    children: TreeNodeType[];
    path: string;
  }
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

  //  将文件路径转换为库渲染的树结构
  const useFileTree = (filePaths: Set<string>) => {
    return useMemo(() => {
      const root: { children: TreeNodeType[] } = { children: [] };
      let idCounter = 1;

      filePaths.forEach((path) => {
        const parts = path.split("/").filter(Boolean);
        let currentLevel = root;
        let currentPath = "";

        parts.forEach((part, index) => {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          const existingNode = currentLevel.children?.find(
            (child) => child.name === part,
          );

          if (existingNode) {
            if (index === parts.length - 1) {
              existingNode.path = currentPath;
            }
            currentLevel = existingNode;
          } else {
            const isFile = index === parts.length - 1;
            const newNode: TreeNodeType = {
              id: `node-${idCounter++}`,
              name: part,
              children: isFile ? undefined : [],
              path: currentPath,
            };

            currentLevel.children?.push(newNode);
            currentLevel = newNode;
          }
        });
      });
      return root.children || [];
    }, [filePaths, activeTab]);
  };
  const gitFileTree = useFileTree(gitChangedNodes);
  const importFileTree = useFileTree(importChangedNodes);
  const totalCount = useMemo(() => {
    return activeTab === "git" ? gitChangedNodes.size : importChangedNodes.size;
  }, [activeTab, gitChangedNodes.size, importChangedNodes.size]);
  const TreeNode = ({ node, style }: NodeRendererProps<TreeNodeType>) => {
    const handleFileListClick = useCallback(
      (path: string) => {
        if (activeTab === "git") {
          renderTreeByGraphId(path, undefined, true);
        } else if (activeTab === "import") {
          renderTreeByGraphId(path);
        }
      },
      [gitChangedNodes, importChangedNodes, activeTab, setHighlightedNodeIds],
    );

    return (
      <div
        className="cursor-pointer transition-all duration-300 ease-in-out  active:scale-95 hover:bg-gray-100 hover:text-blue-500"
        style={style}
        onClick={() => {
          node.toggle();
          node.isLeaf ? handleFileListClick(node.data.path) : "";
        }}
      >
        {node.isLeaf
          ? activeTab === "git"
            ? "📄"
            : "⚡"
          : node.isOpen
          ? "🗁"
          : "🗀"}
        &nbsp;{node.data.name}
      </div>
    );
  };

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

      <div
        className="flex-1 overflow-auto p-4"
        style={{ scrollbarWidth: "none" }}
      >
        {activeTab === "git" && (
          <div className="space-y-2" style={{ height: "calc(100vh - 200px)" }}>
            {gitChangedNodes.size === 0 ? (
              <div className="text-gray-400 p-4 text-center">
                {/* 暂无受影响文件 */}
                {t("static.sidebar.global.noGit")}
              </div>
            ) : (
              <Tree
                initialData={gitFileTree}
                openByDefault={false}
                height={1000}
              >
                {TreeNode}
              </Tree>
            )}
          </div>
        )}

        {activeTab === "import" && (
          <div className="space-y-2" style={{ scrollbarWidth: "none" }}>
            {importChangedNodes.size === 0 ? (
              <div className="text-gray-400 p-4 text-center">
                {/* 暂无受影响文件 */}
                {t("static.sidebar.global.noImport")}
              </div>
            ) : (
              <Tree
                initialData={importFileTree}
                openByDefault={false}
                height={1000}
              >
                {TreeNode}
              </Tree>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
