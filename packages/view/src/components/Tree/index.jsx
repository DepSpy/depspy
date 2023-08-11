import bump from "./bump";
import * as d3 from "d3";
import { useEffect, useState, useRef, useReducer } from "react";
export function Tree({ originalData, width = window.innerWidth }) {
  const [data, setData] = useState(() => filterCache(originalData));
  const [offsetY, setOffsetY] = useState([]);
  const [links, setLinks] = useState([]);
  const [height, setHeight] = useState(0);
  const [, setCurrentHighlight] = useReducer((cur, nextPath) => {
    cur.highlight = false;
    const nextHighLight = findDepBypath(nextPath, data);
    nextHighLight.highlight = true;
    setData({ ...data });
    return nextHighLight;
  }, {});
  //用来记录不影响重渲染的值
  let { current } = useRef({
    dx: 10,
    x0: 99999,
    x1: -99999,
    dy: 10,
  });
  useEffect(() => {
    //形成d3的分层结构
    const root = d3.hierarchy(data, (d) => {
      return Object.values(d.dependencies);
    });
    current.dx = 10;
    current.dy = width / (root.height + 1);
    //形成树结构
    const tree = d3.tree().nodeSize([30, 150]);
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
    const offsetY = [];
    const links = [];
    const rootLinks = root.links();
    //将单一引用改为两个，便于始末节点的分离
    for (let i = 0; i < rootLinks.length; i++) {
      const d = rootLinks[i];
      if (d.source.depth) {
        const sourceOffsetY = d.source.y + d.source.offset;
        const targetOffsetY = d.target.y + d.source.offset;
        offsetY.push({ ...d.target, y: targetOffsetY });
        d.source = { ...d.source, y: sourceOffsetY };
        d.target = { ...d.target, y: targetOffsetY };
      } else {
        offsetY.push({
          ...d.source,
          y: d.source.y - d.source.offset,
        });
        offsetY.push({ ...d.target, y: d.target.y });
      }
      links.push(d);
    }
    setOffsetY(offsetY);
    setLinks(links);
    //计算svg的高度
    setHeight(current.x1 - current.x0 + current.dx * 2);
  }, [width, data]);

  return (
    <svg
      style={{ maxWidth: "100%", height: "auto", font: "12px sans-serif" }}
      width={width}
      height={height}
      viewBox={`${-current.dy / 3}, ${
        current.x0 - current.dx
      }, ${width}, ${height}`}
    >
      <g fill="none" stroke-width={1.5}>
        {links.map((d) => {
          const highlight = d.source.data.highlight || d.target.data.highlight;
          return (
            <path
              markerEnd={highlight ? "url(#triangleBlue)" : "url(#triangle)"}
              stroke={highlight ? "#1890ff" : "rgb(167,167,167)"}
              d={d3
                .link(bump)
                .x((d) => d.y)
                .y((d) => d.x)(d)}
            ></path>
          );
        })}
      </g>
      <g strokeLinejoin="round" strokeWidth={3}>
        {offsetY.map((d) => {
          return (
            <g
              cursor={"pointer"}
              onClick={() => {
                setCurrentHighlight(d.data.path);
              }}
              transform={`translate(${d.y + d.width / 2},${d.x})`}
            >
              <rect
                fill="none"
                stroke={d.data.highlight ? "#1890ff" : "rgb(167,167,167)"}
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
              {d.data.collapseFlag && (
                <text
                  fill="rgb(167,167,167)"
                  fontSize={25}
                  fontWeight={400}
                  transform={`translate(${d.width / 2},${-4})`}
                  onClick={() => {
                    const currentNode = findDepBypath(d.data.path, data);
                    if (d.data.collapseFlag == "+") {
                      currentNode.dependencies = d.data.originDeps;
                      currentNode.collapseFlag = "-";
                    } else {
                      currentNode.dependencies = {};
                      currentNode.collapseFlag = "+";
                    }
                    setData({ ...data });
                  }}
                >
                  {d.data.collapseFlag}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
function findDepBypath(paths, data) {
  let parent = data;
  let dep;
  paths.slice(1).forEach((path) => {
    dep = parent.dependencies[path];
    parent = dep;
  });
  return dep;
}
function filterCache(data) {
  const cacheSet = new Set();
  function traverse(data) {
    const newData = {
      ...data,
      originDeps: { ...data.dependencies },
      dependencies: { ...data.dependencies },
    };
    if (cacheSet.has(newData.cache)) {
      return {
        ...newData,
        dependencies: {},
        collapseFlag: "+",
      };
    } else if (newData.cache) {
      newData.collapseFlag = "-";
      cacheSet.add(newData.cache);
    }
    const entries = Object.entries(newData.dependencies);
    for (let i = 0; i < entries.length; i++) {
      const [name, dependency] = entries[i];
      newData.dependencies[name] = traverse(dependency);
    }
    return newData;
  }
  return traverse(data);
}
