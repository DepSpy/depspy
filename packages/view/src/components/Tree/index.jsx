import bump from "./bump";
import * as d3 from "d3";
import { useEffect, useState, useRef, useReducer } from "react";
import { useStore } from "../../contexts";
const domeCircle = {
  declarationVersion: "^1.2.0",
  description: "Missing ECMAScript module utils for Node.js",
  circlePath: ["dep-spy", "vitest", "vite-node", "mlly", "pkg-types", "mlly"],
  name: "mlly",
  version: "1.4.0",
  dependencies: {},
  path: ["dep-spy", "vitest", "vite-node", "mlly", "pkg-types", "mlly"],
};
export function Tree({ originalData, width = window.innerWidth }) {
  //全局数据
  const { setSelectNode, selectedNode } = useStore((state) => ({
    setSelectNode: state.setSelectNode,
    selectedNode: state.selectedNode,
  }));
  //改变内部数据不能检测，所以改为引用类型包裹以便更新
  const [data, setData] = useState(() => [filterCache(originalData)]);
  const [offsetY, setOffsetY] = useState({});
  const [links, setLinks] = useState([]);
  //用来记录不影响重渲染的值
  let { current } = useRef({
    rootLength: 0,
  });
  //生成渲染数据
  useEffect(() => {
    const { offsetY, links, rootLength } = generateTree(data[0]);
    current.rootLength = rootLength;
    setOffsetY(offsetY);
    setLinks(links);
  }, [width, data]);
  //循环
  const [circlePath, setCirclePath] = useState("");
  useEffect(() => {
    if (Object.values(offsetY).length) {
      const circleParentPath = [];
      domeCircle.path.some((path) => {
        circleParentPath.push(path);
        if (path === domeCircle.path.at(-1)) {
          return true;
        }
        return false;
      });
      const { x: x0, y: y0, width: width0 } = offsetY[circleParentPath.join()];
      const { x, y, width } = offsetY[domeCircle.path.join()];
      const x1 = y + width / 2,
        x2 = y0 + width0 / 2,
        y1 = x,
        y2 = x0;
      const path = d3.path();
      path.moveTo(x1, y1);
      path.lineTo(x2, y2);
      setCirclePath(path.toString());
      // const bezierCurve = d3
      //   .line()
      //   .x((d) => d.x)
      //   .y((d) => d.y)
      //   .curve(d3.curveBasis);
      // const x1 = y + width / 2,
      //   x2 = y0 + width0 / 2,
      //   y1 = x,
      //   y2 = x0;
      // const middleX = (x2 + x1) / 2;
      // setCirclePath([
      //   bezierCurve([
      //     { x: x1, y: y1 },
      //     { x: middleX, y: midPerpendicular(x1, y1, x2, y2)(middleX + 5) },
      //     { x: x2, y: y2 },
      //   ]),
      //   bezierCurve([
      //     { x: x2, y: y2 },
      //     { x: middleX, y: midPerpendicular(x1, y1, x2, y2)(middleX - 5) },
      //     { x: x1, y: y1 },
      //   ]),
      // ]);
    }
  }, [domeCircle, offsetY]);
  //高亮
  const svg = useRef(null);
  const [curHighlight, setCurHighlight] = useReducer((cur, nextPath) => {
    const nextHighLight = findDepBypath(nextPath, data[0]);
    cur.highlight = false;
    nextHighLight.highlight = true;
    setData([...data]);
    return nextHighLight;
  }, {});
  useEffect(() => {
    const nextPath = selectedNode.path;
    setCurHighlight(nextPath);
  }, [selectedNode]);

  useEffect(() => {
    const zoom = d3.zoom().scaleExtent([0.1, 5]).on("zoom", zoomed);

    function zoomed(e) {
      d3.selectAll("#resizing").attr("transform", e.transform);
    }
    d3.select(svg.current).call(zoom).call(zoom.transform, d3.zoomIdentity);
  }, [curHighlight]);
  return (
    <>
      <svg
        ref={svg}
        width={width}
        height={innerHeight}
        viewBox={`${-width / 2}, ${-innerHeight / 2}, ${width}, ${innerHeight}`}
      >
        <g id="resizing" fill="none">
          {links.map((d) => {
            const highlight =
              d.source.data.highlight || d.target.data.highlight;
            return (
              <path
                strokeWidth={1.5}
                markerEnd={highlight ? "url(#triangleBlue)" : "url(#triangle)"}
                stroke={highlight ? "rgb(91, 46, 238)" : "rgb(167,167,167)"}
                d={d3
                  .link(bump)
                  .x((d) => d.y)
                  .y((d) => d.x)(d)}
              ></path>
            );
          })}
        </g>
        <g fill="none" id="resizing" strokeLinejoin="round" strokeWidth={3}>
          {Object.values(offsetY).map((d) => {
            const {
              width,
              x,
              y,

              data: {
                highlight,
                name,
                declarationVersion,
                version,
                collapseFlag,
              },
            } = d;
            const declarationId = `${name}@${declarationVersion || version}`;
            const id = `${name}@${version || declarationVersion}`;
            const coId = `${selectedNode.name}@${
              selectedNode.version || selectedNode.declarationVersion
            }`;
            const isCo = coId == id;
            if (highlight) {
              d3.select(svg.current)
                .transition(1000)
                .attr(
                  "viewBox",
                  `${y + width / 2 - innerWidth / 2}, ${
                    x - innerHeight / 2
                  }, ${innerWidth}, ${innerHeight}`,
                );
            }
            return (
              <g
                cursor={"pointer"}
                onClick={() => {
                  setSelectNode(findDepBypath(d.data.path, originalData));
                }}
                transform={`translate(${y + width / 2},${x})`}
              >
                <title>{version}</title>
                <rect
                  fill={isCo ? "rgb(91, 46, 238)" : "none"}
                  stroke={
                    highlight || isCo ? "rgb(91, 46, 238)" : "rgb(167,167,167)"
                  }
                  strokeWidth={2}
                  width={width}
                  height={30}
                  rx={5}
                  ry={5}
                  transform={`translate(${-width / 2},${-15})`}
                ></rect>
                <text
                  fill={isCo ? "white" : "black"}
                  fontSize={15}
                  transform={`translate(${0},${5})`}
                  text-anchor="middle"
                >
                  {declarationId}
                </text>
                {collapseFlag && (
                  <g
                    transform={`translate(${width / 2 + 2},${-32})`}
                    onClick={() => {
                      const currentNode = findDepBypath(d.data.path, data[0]);
                      if (collapseFlag == "+") {
                        currentNode.dependencies = d.data.originDeps;
                        currentNode.collapseFlag = "-";
                      } else {
                        currentNode.dependencies = {};
                        currentNode.collapseFlag = "+";
                      }
                      setData([...data]);
                    }}
                  >
                    <rect
                      fill="none"
                      stroke={
                        d.data.highlight
                          ? "rgb(91, 46, 238)"
                          : "rgb(167,167,167)"
                      }
                      strokeWidth={2}
                      width={13}
                      height={13}
                    ></rect>
                    <text
                      fontSize={collapseFlag == "-" ? 27 : 15}
                      fill={
                        d.data.highlight
                          ? "rgb(91, 46, 238)"
                          : "rgb(167,167,167)"
                      }
                      transform={`translate(${0.5},${
                        collapseFlag == "-" ? 15 : 11.5
                      })`}
                    >
                      {collapseFlag}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          <path
            strokeWidth={2}
            stroke="red"
            markerEnd="url(#triangleRed)"
            d={circlePath}
          ></path>
          {/* <path
            markerEnd="url(#triangleRed)"
            strokeWidth={2}
            stroke="red"
            d={circlePath[0]}
          ></path>
          <path
            markerEnd="url(#triangleRed)"
            strokeWidth={2}
            stroke="red"
            d={circlePath[1]}
          ></path> */}
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
            <path
              d="M 0 0 L 8 4 L 0 8 "
              fill="none"
              stroke="rgb(91, 46, 238)"
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
            id="triangleRed"
            viewBox="0 0 8 8"
            refX="8"
            refY="4"
            markerUnits="strokeWidth"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path d="M 0 0 L 8 4 L 0 8 " fill="none" stroke="red" />
          </marker>
        </defs>
      </svg>
    </>
  );
}
//中垂线公式
// function midPerpendicular(x1, y1, x2, y2) {
//   const xm = (x1 + x2) / 2;
//   const ym = (y1 + y2) / 2;
//   const k = (y2 - y1) / (x2 - x1);
//   const K = -1 / k;
//   //`y - ${ym} = ${K} * (x - ${xm})`
//   if (x1 == x2) {
//     return () => ym;
//   }
//   return (x) => K * (x - xm) + ym;
// }
//生成渲染所需要的数据
function generateTree(data) {
  //形成d3的分层结构
  const root = d3.hierarchy(data, (d) => {
    return Object.values(d.dependencies);
  });
  let rootLength = 0;
  //形成树结构
  const tree = d3.tree().nodeSize([50, 300]);
  tree(root);
  //动态计算偏移量
  root.eachBefore((d) => {
    const { name, declarationVersion, version } = d.data;
    const nodeWidth = Math.max(
      (name.length + (declarationVersion || version).length) * 11,
      50,
    );
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
  const offsetY = {};
  const links = [];
  const rootLinks = root.links();
  //将单一引用改为两个，便于始末节点的分离
  for (let i = 0; i < rootLinks.length; i++) {
    const d = rootLinks[i];
    if (d.source.depth) {
      const sourceOffsetY = d.source.y + d.source.offset;
      const targetOffsetY = d.target.y + d.source.offset;
      offsetY[d.target.data.path.join()] = { ...d.target, y: targetOffsetY };
      d.source = { ...d.source, y: sourceOffsetY };
      d.target = { ...d.target, y: targetOffsetY };
    } else {
      offsetY[d.source.data.path.join()] = {
        ...d.source,
        y: d.source.y - d.source.offset,
      };
      offsetY[d.target.data.path.join()] = { ...d.target, y: d.target.y };
    }
    links.push(d);
  }
  return { offsetY, links, rootLength };
}
//找到路径下的node
function findDepBypath(paths, data) {
  let parent = data;
  let dep = data;
  paths.slice(1).forEach((path) => {
    if (!parent.dependencies[path]) {
      parent.collapseFlag = "-";
      parent.dependencies = parent.originDeps;
    }
    dep = parent.dependencies[path];
    parent = dep;
  });
  return dep;
}
//过滤相同依赖
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
  const root = traverse(data);
  return root;
}
