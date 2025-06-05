import { useRef } from "react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer";
import { DiffStyles } from "~/types";
const Modal = ({ visible = false, oldValue = "", newValue = "" }) => {
  const modalRef = useRef(null);
  const diffStyles: DiffStyles = {
    oldValue: oldValue,
    newValue: newValue,
    splitView: false,
    compareMethod: DiffMethod.LINES,
    showDiffOnly: true,
    hideLineNumbers: true,
    linesOffset: 100,
    styles: {
      variables: {
        light: {
          diffViewerColor: "var(--diff-text-color)",
          diffViewerBackground: "var(--diff-background-color)",
          addedColor: "var(--diff-text-color)",
          wordAddedBackground: "transparent",
          addedBackground: "var(--diff-added-background-color)",
          removedColor: "var(--diff-text-color)",
          wordRemovedBackground: "transparent",
          removedBackground: "var(--diff-removed-background-color)",
          diffViewerTitleBackground: "var(--color-bg-layout)",
          codeFoldBackground: "var(--diff-background-color)",
          codeFoldContentColor: "var(--diff-fold-color)",
          emptyLineBackground: "var(--diff-background-color)",
        },
        dark: {
          diffViewerColor: "var(--diff-text-color)",
          addedColor: "var(--diff-text-color)",
          wordAddedBackground: "transparent",
          addedBackground: "var(--diff-added-background-color)",
          removedColor: "var(--diff-text-color)",
          wordRemovedBackground: "transparent",
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
        overflowX: "auto",
      },
      line: {
        padding: "4px 0",
      },
    },
  };
  return (
    visible && (
      <div
        ref={modalRef}
        className="rounded-lg shadow-lg
              w-[70vw] h-[95vh] overflow-auto mx-auto "
        style={{
          scrollbarWidth: "none",
          border: "1px solid var(--color-text)",
        }}
      >
        <ReactDiffViewer {...diffStyles}></ReactDiffViewer>
      </div>
    )
  );
};

export default Modal;
