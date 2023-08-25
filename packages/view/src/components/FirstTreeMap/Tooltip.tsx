import React, { ReactNode, useEffect, useRef, useState } from "react";
import { Portal } from "./Portal";

interface ITooltipsProps {
  content?: ReactNode;
  children: React.ReactElement;
}

export const Tooltip: React.FC<ITooltipsProps> = ({ content, children }) => {
  const triggerEl = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [position, setPosition] = useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });
  useEffect(() => {
    if (!triggerEl || !triggerEl.current || !tooltipRef || !tooltipRef.current)
      return;
    const { current } = triggerEl;
    const { current: tooltip } = tooltipRef;
    // console.log(current.getBoundingClientRect())
    const { left, top, width } = current.getBoundingClientRect();
    const { width: tooltipWidth, height: tooltipHeight } =
      tooltip.getBoundingClientRect();
    // console.log(tooltip.getBoundingClientRect());
    // console.log(document.documentElement.scrollTop);

    setPosition({
      left:
        left + (width - tooltipWidth) / 2 + document.documentElement.scrollLeft,
      top:
        top - Math.abs(tooltipHeight + 5) + document.documentElement.scrollTop,
    });
    // setPosition({ left:left + (width - tooltipWidth) / 2, top: top - Math.abs(tooltipHeight + 5) + document.documentElement.scrollTop })
  }, [triggerEl, tooltipRef, open]);

  return (
    <>
      {React.cloneElement(children, {
        ref: triggerEl,
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
      })}
      {open ? (
        <Portal>
          <div
            ref={tooltipRef}
            style={{
              position: "absolute",
              zIndex: 9999,
              left: position.left,
              top: position.top,
              backgroundColor: "white",
              borderRadius: "5px",
              padding: "10px",
              boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.2)",
            }}
          >
            {content}
          </div>
        </Portal>
      ) : (
        void 0
      )}
    </>
  );
};
