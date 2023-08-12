import bump from "./bump";
import * as d3 from "d3";
import { useEffect, useState, useRef, useReducer } from "react";
export function Tree({ originalData, width = window.innerWidth }) {
  const [data, setData] = useState(() => [filterCache(originalData)]);
  const [offsetY, setOffsetY] = useState([]);
  const [links, setLinks] = useState([]);
  const curHighlightRect = useRef(null);
  const [, setCurHighlight] = useReducer((cur, nextPath) => {
    const nextHighLight = findDepBypath(nextPath, data[0]);
    cur.highlight = false;
    nextHighLight.highlight = true;
    setData([...data]);
    return nextHighLight;
  }, {});
  //用来记录不影响重渲染的值
  let { current } = useRef({
    rootLength: 0,
  });
  useEffect(() => {
    const { offsetY, links, rootLength } = generateTree(data[0]);
    current.rootLength = rootLength;
    setOffsetY(offsetY);
    setLinks(links);
  }, [width, data]);

  const svg = useRef(null);
  useEffect(() => {
    const zoom = d3.zoom().scaleExtent([0.1, 5]).on("zoom", zoomed);
    function zoomed(e) {
      d3.selectAll("#resizing").attr("transform", e.transform);
    }
    d3.select(svg.current).call(zoom).call(zoom.transform, d3.zoomIdentity);
  }, []);
  return (
    <>
      <svg
        ref={svg}
        width={width}
        height={innerHeight}
        viewBox={`${-current.rootLength}, ${
          -width / 2
        }, ${width}, ${innerHeight}`}
      >
        <g id="resizing" fill="none">
          {links.map((d) => {
            const highlight =
              d.source.data.highlight || d.target.data.highlight;
            return (
              <path
                strokeWidth={2}
                markerEnd={highlight ? "url(#triangleBlue)" : "url(#triangle)"}
                stroke={highlight ? "#1890ff" : "rgb(167,167,167)"}
                data-d={JSON.stringify({
                  source: { x: d.source.x, y: d.source.y },
                  target: { x: d.target.x, y: d.target.y },
                })}
                d={d3
                  .link(bump)
                  .x((d) => d.y)
                  .y((d) => d.x)(d)}
              ></path>
            );
          })}
        </g>
        <g id="resizing" strokeLinejoin="round" strokeWidth={3}>
          {offsetY.map((d) => {
            const { width, x, y } = d;
            return (
              <g
                cursor={"pointer"}
                onClick={() => {
                  setCurHighlight(d.data.path);
                }}
                data-transform={`translate(${y + width / 2},${x})`}
                transform={`translate(${y + width / 2},${x})`}
              >
                <rect
                  fill="none"
                  ref={d.data.highlight ? curHighlightRect : null}
                  stroke={d.data.highlight ? "#1890ff" : "rgb(167,167,167)"}
                  strokeWidth={2}
                  width={width}
                  height={18}
                  rx={5}
                  ry={5}
                  transform={`translate(${-width / 2},${-9})`}
                ></rect>
                <text
                  fontSize={12}
                  stroke="white"
                  transform={`translate(${0},${4})`}
                  text-anchor="middle"
                >
                  {d.data.name}
                </text>
                <text
                  fontSize={12}
                  transform={`translate(${0},${4})`}
                  text-anchor="middle"
                >
                  {d.data.name}
                </text>
                {d.data.collapseFlag && (
                  <text
                    fill="rgb(167,167,167)"
                    fontSize={25}
                    fontWeight={400}
                    transform={`translate(${d.width / 2},${-4})`}
                    onClick={() => {
                      const currentNode = findDepBypath(d.data.path, data[0]);
                      if (d.data.collapseFlag == "+") {
                        currentNode.dependencies = d.data.originDeps;
                        currentNode.collapseFlag = "-";
                      } else {
                        currentNode.dependencies = {};
                        currentNode.collapseFlag = "+";
                      }
                      setData([...data]);
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
      <svg
        width={0}
        height={0}
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker
            id="triangle"
            viewBox="0 0 8 8"
            refX="8"
            refY="4"
            markerUnits="strokeWidth"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path
              d="M 0 0 L 8 4 L 0 8 "
              fill="none"
              stroke="rgb(169, 169, 169)"
            />
          </marker>
        </defs>
      </svg>
      <svg
        width={0}
        height={0}
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker
            id="triangleBlue"
            viewBox="0 0 8 8"
            refX="8"
            refY="4"
            markerUnits="strokeWidth"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path d="M 0 0 L 8 4 L 0 8 " fill="none" stroke="#1890ff" />
          </marker>
        </defs>
      </svg>
    </>
  );
}

function generateTree(data) {
  //形成d3的分层结构
  const root = d3.hierarchy(data, (d) => {
    return Object.values(d.dependencies);
  });
  let rootLength = 0;
  //形成树结构
  const tree = d3.tree().nodeSize([30, 150]);
  tree(root);
  //动态计算偏移量
  root.eachBefore((d) => {
    const nodeWidth = Math.max(d.data.name.length * 8, 50);
    if (d.depth == 0 || d.depth == 1) {
      d.offset = nodeWidth;
      if (!d.depth) {
        rootLength = nodeWidth;
      }
    } else {
      d.offset = d.parent.offset + nodeWidth;
    }
    d.width = nodeWidth;
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
  return { offsetY, links, rootLength };
}
function findDepBypath(paths, data) {
  let parent = data;
  let dep = data;
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
