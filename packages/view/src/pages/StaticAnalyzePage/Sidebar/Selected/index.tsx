import { useStaticStore } from "@/contexts";
import { traverseTree, extractFileName } from "../../utils";
import { shallow } from "zustand/shallow";
import { useEffect, useState, useMemo } from "react";
import useLanguage from "@/i18n/hooks/useLanguage";
import { useStore } from "@/contexts";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer";
import "./index.scss";

export const Selected = () => {
  const { staticRoot, highlightedNodeIds } = useStaticStore(
    (state) => ({
      staticRoot: state.staticRoot,
      highlightedNodeIds: state.highlightedNodeIds,
    }),
    shallow,
  );
  const { language } = useStore(
    (state) => ({
      language: state.language,
    }),
    shallow,
  );
  const { t } = useLanguage();

  //用于渲染节点信息列表
  const [selectNodeInfo, setSelectNodeInfo] = useState<SelectNodeInfo>({
    name: "",
    removedExports: [],
    renderedExports: [],
    isGitChange: false,
    isImportChange: false,
    isSideEffectChange: false,
    exportEffectedNamesToReasons: {},
    importEffectedNames: {},
    preCode: "",
    curCode: "",
  });
  // 用于配置git diff的样式
  const diffStyles = {
    oldValue: selectNodeInfo.preCode,
    newValue: selectNodeInfo.curCode,
    splitView: true,
    compareMethod: DiffMethod.LINES,
    showDiffOnly: true,
    hideLineNumbers: true,
    leftTitle: t("static.preCode"),
    rightTitle: t("static.curCode"),
    linesOffset: 100,
    styles: {
      variables: {
        light: {
          diffViewerColor: "var(--diff-text-color)",
          diffViewerBackground: "var(--diff-background-color)",
          addedColor: "var(--diff-added-color)",
          wordAddedBackground: "var(--diff-word-added-background-color)",
          addedBackground: "var(--diff-added-background-color)",
          removedColor: "var(--diff-removed-color)",
          wordRemovedBackground: "var(--diff-word-removed-background-color)",
          removedBackground: "var(--diff-removed-background-color)",
          diffViewerTitleBackground: "var(--color-bg-layout)",
          codeFoldBackground: "var(--diff-background-color)",
          emptyLineBackground: "var(--diff-background-color)",
        },
        dark: {
          diffViewerColor: "var(--diff-text-color)",
          diffViewerBackground: "var(--diff-background-color)",
          addedColor: "var(--diff-added-color)",
          wordAddedBackground: "var(--diff-word-added-background-color)",
          addedBackground: "var(--diff-added-background-color)",
          removedColor: "var(--diff-removed-color)",
          wordRemovedBackground: "var(--diff-word-removed-background-color)",
          removedBackground: "var(--diff-removed-background-color)",
          diffViewerTitleBackground: "var(--color-bg-layout)",
          codeFoldBackground: "var(--diff-background-color)",
          emptyLineBackground: "var(--diff-background-color)",
        },
      },
      contentText: {
        fontFamily: '"Fira Code", monospace',
        fontSize: "14px",
        lineHeight: "1.5",
      },
      diffContainer: {
        border: "none",
        boxShadow: "none",
      },
      line: {
        padding: "4px 0",
      },
    },
  };
  useEffect(() => {
    if (!staticRoot || !highlightedNodeIds.size) return;
    const selectId = Array.from(highlightedNodeIds)[0];
    let res: SelectNodeInfo = null;
    traverseTree(staticRoot, (node) => {
      if (selectId === node.id) {
        res = {
          name: node.relativeId,
          removedExports: node.removedExports,
          renderedExports: node.renderedExports,
          exportEffectedNamesToReasons: node.exportEffectedNamesToReasons,
          importEffectedNames: node.importEffectedNames,
          isGitChange: node.isGitChange,
          isImportChange: node.isImportChange,
          isSideEffectChange: node.isSideEffectChange,
          preCode: node.preCode,
          curCode: node.curCode,
        };
      }
    });
    setSelectNodeInfo(res);
  }, [highlightedNodeIds, staticRoot]);

  const SelectNodeCardList = useMemo(() => {
    if (!selectNodeInfo?.name) return null;
    return (
      <div className="w-full h-full p-4 rounded-lg shadow-md mb-4">
        <h2 className="text-[var(--color-primary-text)] text-xl font-bold mb-2">
          {selectNodeInfo.name}
        </h2>

        {/* bool类型字段展示 */}
        <div className="mb-2">
          <div className="list-disc list-inside text-[var(--color-text-description)] my-2">
            {selectNodeInfo.isGitChange && (
              <div className="inline-flex rounded-lg border-[var(--color-primary-border--active)] border-solid p-2 m-2 text-[var(--color-text)] cursor-default">
                Git Changed
              </div>
            )}
            {selectNodeInfo.isImportChange && (
              <div className="inline-flex rounded-lg border-[var(--color-primary-border--active)] border-solid p-2 m-2 text-[var(--color-text)] cursor-default">
                Import Changed
              </div>
            )}
            {selectNodeInfo.isSideEffectChange && (
              <div className="inline-flex rounded-lg border-[var(--color-primary-border--active)] border-solid p-2 m-2 text-[var(--color-text)] cursor-default">
                SideEffect Changed
              </div>
            )}
          </div>
        </div>

        {/* Removed Exports: */}
        <div className="mb-2">
          <p className="text-[var(--color-text)] font-semibold">
            {t("static.sidebar.select.export.remove")}:
          </p>
          {selectNodeInfo.removedExports.length ? (
            <div className="list-disc list-inside text-[var(--color-text-description)] my-2">
              {selectNodeInfo.removedExports.map((exportItem, index) => (
                <div
                  key={index}
                  className="inline-flex rounded-lg border-[var(--color-primary-border)] border-solid p-2 m-2 text-[var(--color-text)] cursor-default"
                >
                  {exportItem}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full text-center text-lg text-[var(--color-primary-text)]">
              {/* 没有移除的导出... */}
              {t("static.sidebar.select.export.noRemove")}
            </div>
          )}
        </div>

        {/* Rendered Exports: */}
        <div>
          <p className="text-[var(--color-text)] font-semibold">
            {t("static.sidebar.select.export.render")}:
          </p>
          {selectNodeInfo.renderedExports.length ? (
            <div className="list-disc list-inside text-[var(--color-text-description)] my-2">
              {selectNodeInfo.renderedExports.map((exportItem, index) => (
                <div
                  key={index}
                  className="inline-flex rounded-lg border-[var(--color-primary-border)] border-solid p-2 m-2 text-[var(--color-text)] cursor-default"
                >
                  {exportItem}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full text-center text-lg text-[var(--color-primary-text)]">
              {/* 没有加载的导出... */}
              {t("static.sidebar.select.export.noRender")}
            </div>
          )}
        </div>

        {/* changedImports */}
        <div className="mb-2">
          <p className="text-[var(--color-text)] font-semibold">
            {t("static.sidebar.select.import.changed")}:
          </p>
          {Object.keys(selectNodeInfo.importEffectedNames).length ? (
            <div className="list-disc list-inside text-[var(--color-text-description)] my-2">
              {Object.keys(selectNodeInfo.importEffectedNames).map((Item) => (
                <div key={Item} className="text-[var(--color-text)]">
                  <div className="pl-2">{extractFileName(Item)}</div>
                  {selectNodeInfo.importEffectedNames[Item].map(
                    (valus, index) => (
                      <div
                        key={index}
                        className="inline-flex rounded-lg border-[var(--color-primary-border)] border-solid p-2 m-2 cursor-default"
                      >
                        {valus}
                      </div>
                    ),
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full text-center text-lg text-[var(--color-primary-text)]">
              {t("static.sidebar.select.import.noChanged")}
            </div>
          )}
        </div>

        {/* changedExports */}
        <div className="mb-2">
          <p className="text-[var(--color-text)] font-semibold">
            {t("static.sidebar.select.export.changed")}:
          </p>
          {Object.keys(selectNodeInfo.exportEffectedNamesToReasons).length ? (
            <div className="list-disc list-inside text-[var(--color-text-description)] my-2">
              {!!Object.keys(selectNodeInfo.exportEffectedNamesToReasons)
                .length &&
                Object.keys(selectNodeInfo.exportEffectedNamesToReasons).map(
                  (Item) => (
                    <div
                      key={Item}
                      className="border-solid rounded-lg my-2 p-2"
                    >
                      <div className="text-[var(--color-text)] font-semibold">
                        {Item || t("static.sidebar.select.export.sideEffect")}
                      </div>
                      <div>Reasons:</div>
                      {selectNodeInfo.exportEffectedNamesToReasons[Item]
                        .isNativeCodeChange && (
                        <div className="inline-flex rounded-lg border-[var(--color-primary-border--active)] border-solid p-2 m-2 text-[var(--color-text)] cursor-default">
                          Native Code Changed
                        </div>
                      )}
                      {Object.keys(
                        selectNodeInfo.exportEffectedNamesToReasons[Item]
                          .importEffectedNames,
                      ).map((key) => (
                        <div key={key} className="text-[var(--color-text)]">
                          <div className="pl-2">{key}</div>
                          {selectNodeInfo.exportEffectedNamesToReasons[
                            Item
                          ].importEffectedNames[key].map((valus, index) => (
                            <div
                              key={index}
                              className="inline-flex rounded-lg border-[var(--color-primary-border)] border-solid p-2 m-2 cursor-default"
                            >
                              {valus ||
                                t("static.sidebar.select.export.sideEffect")}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ),
                )}
            </div>
          ) : (
            <div className="w-full text-center text-lg text-[var(--color-primary-text)]">
              {t("static.sidebar.select.export.noChanged")}
            </div>
          )}
        </div>
        {/* git diff */}
        <div className="mb-2">
          <p className="text-[var(--color-text)] font-semibold">
            {t("static.gitChanged")}:
          </p>
          {Object.keys(selectNodeInfo.curCode).length ? (
            <div className="border-solid rounded-lg my-2 p-2">
              <ReactDiffViewer {...diffStyles} />
            </div>
          ) : (
            <div className="w-full text-center text-lg text-[var(--color-primary-text)]">
              {t("static.sidebar.global.noGit")}
            </div>
          )}
        </div>
      </div>
    );
  }, [selectNodeInfo, language]);

  return (
    <>
      <div className="bg-bg-layout min-w-90">{SelectNodeCardList}</div>
    </>
  );
};

interface SelectNodeInfo {
  name: string;
  removedExports: string[];
  renderedExports: string[];
  isGitChange: boolean;
  isImportChange: boolean;
  isSideEffectChange: boolean;
  exportEffectedNamesToReasons: {
    [key: string]: {
      isNativeCodeChange?: boolean;
      importEffectedNames: {
        [key: string]: string[];
      };
    };
  };
  importEffectedNames: {
    [key: string]: string[];
  };
  preCode: string;
  curCode: string;
}
