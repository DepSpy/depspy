import useLanguage from "@/i18n/hooks/useLanguage";
import { useRef, useState } from "react";
import "./index.scss";
import { Global } from "./Global";
import { Selected } from "./Selected";

export const Sidebar = () => {
  const containerRef = useRef(null);
  const [choose, setChoose] = useState<"global" | "selected">("global");
  const { t } = useLanguage();
  const draggleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // 记录鼠标初始位置和元素初始宽度
    const startX = e.clientX;
    const startWidth = containerRef.current.offsetWidth;
    const mouseMove = (ev) => {
      // 计算鼠标移动的距离
      const dx = startX - ev.clientX;

      containerRef.current.style.width = `${startWidth + dx}px`;
    };
    const mouseUp = (ev) => {
      // 销毁监听函数
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseup", mouseUp);
    };
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseup", mouseUp);
  };

  return (
    <div className="fixed h-[100%] flex right-0 bg-bg-container">
      <div
        onMouseDown={draggleMouseDown}
        className="w-[2px] h-[100%] cursor-col-resize absolute translate-x-[-50%] bg-border"
      ></div>
      <div
        ref={containerRef}
        className="sidebar-container w-90 h-[100%] text-text overflow-y-auto"
      >
        {choose === "global" ? <Global /> : <Selected />}
      </div>
      <div
        onClick={() => setChoose("global")}
        className={
          choose === "selected"
            ? "static-sidebar-choose-item-active left-[calc(-3rem-3px)] top-[25vh]"
            : "static-sidebar-choose-item left-[calc(-3rem-3px)] top-[25vh]"
        }
      >
        {t("static.sidebar.choose.global")}
      </div>
      <div
        onClick={() => setChoose("selected")}
        className={
          choose === "global"
            ? "static-sidebar-choose-item-active left-[calc(-3rem-3px)] bottom-[25vh]"
            : "static-sidebar-choose-item left-[calc(-3rem-3px)] bottom-[25vh]"
        }
      >
        {t("static.sidebar.choose.select")}
      </div>
    </div>
  );
};
