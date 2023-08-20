import * as d3 from "d3";
import { ReactElement, useContext, useEffect } from "react";
import { useState } from "react";
import { useRef } from "react";
import { Data } from "./types";
import { context } from "./store/context";
import { Tooltip } from "./Tooltip";
interface DrawRectProps {
  treeMap: d3.HierarchyRectangularNode<Data>;
  RectFontSize?: number;
}
function DrawRect({ treeMap, RectFontSize }: DrawRectProps) {
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
              RectFontSize={RectFontSize}
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
  RectFontSize: number;
}
export const DrawChildrenRect = ({
  x0,
  x1,
  y0,
  y1,
  data,
  color,
  RectFontSize,
}: DrawChildrenRectProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState<string>("false");

  const handle_rect_click = useContext(context);
  useEffect(() => {
    if (!ref || !ref.current) return;
    const { current } = ref;
    if (
      current.scrollWidth > current.clientWidth ||
      current.scrollHeight > current.clientHeight
    ) {
      setHidden(hidden === "true" ? "false" : "true");
    }
  }, [ref, hidden]);
  const hiddenMode: Record<string, undefined | ReactElement> = {
    true: (
      <Tooltip
        content={
          <>
            name: {data.name}
            <br />
            size: {data.size}
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
          }}
          ref={ref}
          onClick={handle_rect_click ? handle_rect_click(data) : void 0}
        ></div>
      </Tooltip>
    ),
    false: (
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
        }}
        ref={ref}
        onClick={handle_rect_click ? handle_rect_click(data) : void 0}
      >
        name: {data.name}
        <br />
        size: {data.size}
      </div>
    ),
  };

  return hiddenMode[hidden];
};
