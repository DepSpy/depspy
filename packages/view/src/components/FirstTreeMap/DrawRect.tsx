import * as d3 from "d3";
import { useContext, useEffect } from "react";
import { useState } from "react";
import { useRef } from "react";
import { Data } from "./types";
import { context } from "./store/context";
import { Tooltip } from "./Tooltip";
interface DrawRectProps {
  treeMap: d3.HierarchyRectangularNode<Data>;
  isHierarchy: boolean;
}
function DrawRect({ treeMap, isHierarchy }: DrawRectProps) {
  const forTree = treeMap.leaves();
  console.log(treeMap, forTree, isHierarchy);

  const colorScale = d3.scaleSequential(
    [forTree.length <= 4 ? 8 : forTree.length * 2, 0],
    d3.interpolateMagma,
  );
  return (
    <div style={{ position: "relative" }}>
      {isHierarchy && (
        <DrawChildrenRect
          x0={treeMap.x0}
          y0={treeMap.y0}
          x1={treeMap.x1}
          y1={treeMap.y1}
          data={treeMap.data}
          key={treeMap.value || 0}
          color={colorScale(forTree.length)}
        ></DrawChildrenRect>
      )}
      {forTree.map(
        (
          { x0, y0, x1, y1, data, value }: d3.HierarchyRectangularNode<Data>,
          i,
        ) => {
          return (
            <DrawChildrenRect
              x0={x0}
              y0={y0}
              x1={x1}
              y1={y1}
              data={data}
              key={value || 0}
              color={colorScale(i)}
            ></DrawChildrenRect>
          );
        },
      )}
    </div>
  );
}
export default DrawRect;
interface DrawChildrenRectProps {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  data: Data;
  // handle_rect_click:(data: Data) => () => void;
  color: string;
}
export const DrawChildrenRect = ({
  x0,
  x1,
  y0,
  y1,
  data,
  color,
}: DrawChildrenRectProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState<boolean>(false);
  const [show, setShow] = useState<boolean>(false);
  const [leaves, setLeaves] = useState<boolean>(false);
  const { handle_rect_click, loading, RectFontSize } = useContext(context);
  useEffect(() => {
    if (!data._children || data._children.length === 0) {
      setLeaves(true);
    }
    if (!ref || !ref.current) return;
    const { current } = ref;
    if (
      current.scrollWidth > current.clientWidth ||
      current.scrollHeight > current.clientHeight
    ) {
      setHidden(!hidden);
    }
  }, [ref, hidden]);
  const rectClick = (e) => {
    console.log(data.name);
    if (!data._children || data._children.length === 0) return;
    handle_rect_click(data)(e);
  };
  return (
    <>
      {hidden ? (
        <Tooltip
          content={
            <>
              <div>name: {data.name}</div>
              <div>size: {data.size}</div>
            </>
          }
        >
          <div
            style={{
              position: "absolute",
              backgroundColor: color,
              left: x0,
              top: y0,
              width: x1 - x0,
              height: y1 - y0,
              overflow: "hidden",
              cursor: leaves ? "not-allowed" : "default",
              boxShadow:
                "0 0 0 1px rgba(16, 22, 26, 0.04), 0 1px 3px 0 rgba(16, 22, 26, 0.12)",
            }}
            ref={ref}
            onClick={rectClick}
          ></div>
        </Tooltip>
      ) : (
        <div
          style={{
            position: "absolute",
            backgroundColor: color,
            left: x0,
            top: show ? y0 - 5 : y0,
            width: x1 - x0,
            height: y1 - y0,
            overflow: "hidden",
            fontSize: RectFontSize,
            transition: "all 0.3s ease",
            padding: "0.3rem",
            cursor: leaves ? "not-allowed" : "default",
            boxShadow: show
              ? "0 0 0 3px rgba(16, 22, 26, 0.1), 0 1px 3px 0 rgba(16, 22, 26, 0.12)"
              : "0 0 0 1px rgba(16, 22, 26, 0.04), 0 1px 3px 0 rgba(16, 22, 26, 0.12)",
          }}
          onMouseMove={() => {
            // console.log("enter", show);
            setShow(true);
          }}
          onMouseLeave={() => {
            // console.log("leave");
            setShow(false);
          }}
          ref={ref}
          onClick={rectClick}
        >
          {data.size != null || data._size != null ? (
            <>
              <div>name: {data.name}</div>
              <div>size: {data.size ? data.size : 0}</div>
            </>
          ) : (
            loading
          )}
        </div>
      )}
    </>
  );
};
