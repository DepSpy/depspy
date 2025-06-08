import { useStaticStore } from "@/contexts";
import { useMemo, useState, useCallback } from "react";
import { shallow } from "zustand/shallow";
import { renderTreeByGraphId } from "../../utils";
import useLanguage from "@/i18n/hooks/useLanguage";
import { Tree, ConfigProvider, Segmented } from "antd";
import Icon, { CaretDownOutlined, FileOutlined, FolderOpenOutlined, FolderOutlined } from '@ant-design/icons';
import { icons } from "./icons";

export const Global = () => {
  const [activeTab, setActiveTab] = useState<"git" | "import">("git");
  const { gitChangedNodes, importChangedNodes } =
    useStaticStore(
      (state) => ({
        staticGraph: state.staticGraph,
        gitChangedNodes: state.gitChangedNodes,
        importChangedNodes: state.importChangedNodes,
      }),
      shallow,
    );
  const { t } = useLanguage();

  //  将文件路径转换为库渲染的树结构
  const useFileTree = (filePaths: Set<string>) => {
    return useMemo(() => {
      const root: { children } = { children: [] };
      let idCounter = 1;

      filePaths.forEach((path) => {
        const parts = path.split("/").filter(Boolean);
        let currentLevel = root;
        let currentPath = "";

        parts.forEach((part, index) => {
          currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
          const existingNode = currentLevel.children?.find(
            (child) => child.title === part,
          );
          const isFile = index === parts.length - 1;
          if (existingNode) {
            if (isFile) {
              existingNode.path = path;
            }
            currentLevel = existingNode;
          } else {
            const newNode = {
              key: `node-${idCounter++}`,
              title: part,
              children: isFile ? undefined : [],
              isLeaf: isFile,
              path: currentPath,
              selectable: isFile,
              icon: ({expanded})=>{
                if(isFile){
                  const ext= path.split(".").pop();
                  return icons[ext]? <Icon component={icons[ext]} />:<FileOutlined />;
                }
                return expanded? <FolderOpenOutlined /> : <FolderOutlined />
              },
            };
            if (isFile) {
              currentLevel.children?.push(newNode);
            } else {
              currentLevel.children?.unshift(newNode);
            }

            currentLevel = newNode;
          }
        });
      });
      return root.children || [];
    }, [filePaths, activeTab]);
  };
  const gitFileTree = useFileTree(gitChangedNodes);
  const importFileTree = useFileTree(importChangedNodes);
  const handleFileListClick = useCallback(
    (path: string) => {
      if (activeTab === "git") {
        renderTreeByGraphId(path, undefined, true);
      } else if (activeTab === "import") {
        renderTreeByGraphId(path);
      }
    },
    [gitChangedNodes, importChangedNodes, activeTab],
  );

  return (
    <div className="h-full w-full overflow-hidden flex flex-col bg-bgLayout">
      <ConfigProvider
        theme={{
          components: {
            Tree: {
              indentSize: 15,
              nodeHoverColor: "#7550f1"
            },
            Segmented: {
              itemSelectedBg: "#7550f1",
              itemHoverColor: "none",
              itemSelectedColor: "none"
            }
          },
        }}>
        <header className="flex justify-center gap-2 pt-4 border-b">
          <Segmented<string>
            className="bg-bgLayout text-text"
            options={[{
              label: t("static.gitChanged"),
              value: "git"
            }, {
              label: t("static.importChanged"),
              value: "import"
            }]}
            size="large"
            onChange={(value) => {
              setActiveTab(value as "git" | "import")
            }}
          />
        </header>
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
                  switcherIcon={<CaretDownOutlined />}
                  className="bg-transparent text-text"
                  treeData={gitFileTree}
                  defaultExpandAll
                  showLine
                  showIcon
                  onSelect={(_, { node }) => {
                    handleFileListClick(node["path"]);
                  }}
                >
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
                  switcherIcon={<CaretDownOutlined />}
                  className="bg-transparent text-text"
                  treeData={importFileTree}
                  defaultExpandAll
                  showLine
                  showIcon
                  onSelect={(_, { node }) => {
                    handleFileListClick(node["path"]);
                  }}
                >
                </Tree>
              )}
            </div>
          )}
        </div>
      </ConfigProvider>
    </div>
  );
};
