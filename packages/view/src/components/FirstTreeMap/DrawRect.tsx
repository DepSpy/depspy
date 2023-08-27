import * as d3 from "d3";
import { useContext, useEffect } from "react";
import { useState } from "react";
import { useRef } from "react";
import { Data } from "./types";
import { context } from "./store/context";
import { Tooltip } from "./Tooltip";
interface DrawRectProps {
  treeMap: d3.HierarchyRectangularNode<Data>;
}
function DrawRect({ treeMap }: DrawRectProps) {
  /*
    treeMap.leaves()
      [{  data:{name,size,children,_children},
          depth:number,
          value:number,
          x0,x1,y0,y1
      }]
    */
  const forTree = treeMap.leaves();
  const colorScale = d3.scaleSequential(
    [forTree.length <= 4 ? 8 : forTree.length * 2, 0],
    d3.interpolateMagma,
  );
  return (
    <div style={{ position: "relative" }}>
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
  const { handle_rect_click, loading, RectFontSize } = useContext(context);
  useEffect(() => {
    if (!ref || !ref.current) return;
    const { current } = ref;
    if (
      current.scrollWidth > current.clientWidth ||
      current.scrollHeight > current.clientHeight
    ) {
      setHidden(!hidden);
    }
  }, [ref, hidden]);

  return (
    <>
      {hidden && (
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
              overflow: "auto",
              boxShadow:
                "0 0 0 1px rgba(16, 22, 26, 0.04), 0 1px 3px 0 rgba(16, 22, 26, 0.12)",
            }}
            ref={ref}
            onClick={handle_rect_click ? handle_rect_click(data) : void 0}
          ></div>
        </Tooltip>
      )}
      {!hidden && (
        <div
          style={{
            position: "absolute",
            backgroundColor: color,
            left: x0,
            top: y0,
            width: x1 - x0,
            height: y1 - y0,
            overflow: "auto",
            fontSize: RectFontSize,
            padding: "0.3rem",
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
          onClick={handle_rect_click ? handle_rect_click(data) : void 0}
        >
          {data.size ? (
            <>
              <div>name: {data.name}</div>
              <div>size: {data.size}</div>
            </>
          ) : (
            loading
          )}
        </div>
      )}
    </>
  );
};
