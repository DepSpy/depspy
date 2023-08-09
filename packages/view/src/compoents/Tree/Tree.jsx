import bump from "./bump";
import * as d3 from "d3";
import { useEffect, useState, useRef } from "react";

export function Tree({ data, width = window.innerWidth }) {
  const [height, setHeight] = useState(0);
  //用来记录不影响重渲染的值
  let { current } = useRef({
    dx: 10,
    x0: 99999,
    x1: -99999,
    dy: 10,
    links: [],
    offsetXY: [],
  });
  useEffect(() => {
    //形成d3的分层结构
    const root = d3.hierarchy(data, (d) => {
      return Object.values(d.dependencies);
    });
    current.dx = 10;
    current.dy = width / (root.height + 1);
    //形成树结构
    const tree = d3.tree().nodeSize([25, 90]);
    tree(root);
    //动态计算偏移量
    root.eachBefore((d) => {
      if (d.depth == 0 || d.depth == 1) {
        d.offset = Math.max(d.data.name.length * 8, 50);
      } else {
        d.offset = d.parent.offset + Math.max(d.data.name.length * 8, 50);
      }
      d.width = Math.max(d.data.name.length * 8, 50);
      if (d.x > current.x1) current.x1 = d.x;
      if (d.x < current.x0) current.x0 = d.x;
    });
    current.offsetXY = [];
    current.links = [];
    const rootLinks = root.links();
    //将单一引用改为两个，便于始末节点的分离
    for (let i = 0; i < rootLinks.length; i++) {
      const d = rootLinks[i];
      if (d.source.depth) {
        const sourceOffsetY = d.source.y + d.source.offset;
        const targetOffsetY = d.target.y + d.source.offset;
        current.offsetXY.push({ ...d.target, x: d.target.x, y: targetOffsetY });
        d.source = { ...d.source, y: sourceOffsetY };
        d.target = { ...d.target, y: targetOffsetY };
      } else {
        current.offsetXY.push({
          ...d.source,
          x: d.source.x,
          y: d.source.y - d.source.offset,
        });
        current.offsetXY.push({ ...d.target, x: d.target.x, y: d.target.y });
      }
      current.links.push(d);
    }
    //计算svg的高度
    setHeight(current.x1 - current.x0 + current.dx * 2);
  }, [width]);

  return (
    <svg
      style={{ maxWidth: "100%", height: "auto", font: "12px sans-serif" }}
      width={width}
      height={height}
      viewBox={`${-current.dy / 3}, ${
        current.x0 - current.dx
      }, ${width}, ${height}`}
    >
      <g fill="none" stroke="rgb(167,167,167)" stroke-width={1.5}>
        {current.links.map((d) => {
          return (
            <path
              markerEnd="url(#triangle)"
              d={d3
                .link(bump)
                .x((d) => d.y)
                .y((d) => d.x)(d)}
            ></path>
          );
        })}
      </g>
      <g strokeLinejoin="round" strokeWidth={3}>
        {current.offsetXY.map((d) => {
          return (
            <g transform={`translate(${d.y + d.width / 2},${d.x})`}>
              <rect
                fill="none"
                stroke="rgb(167,167,167)"
                strokeWidth={2}
                width={Math.max(d.data.name.length * 8, 50)}
                height={18}
                rx={5}
                ry={5}
                transform={`translate(${-d.width / 2},${-9})`}
              ></rect>
              <text
                stroke="white"
                transform={`translate(${0},${4})`}
                text-anchor="middle"
              >
                {d.data.name}
              </text>
              <text transform={`translate(${0},${4})`} text-anchor="middle">
                {d.data.name}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
