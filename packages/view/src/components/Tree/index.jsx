import bump from "./bump";
import { Export } from "../Export/index";
import * as d3 from "d3";
import { useEffect, useState, useRef, useReducer, forwardRef } from "react";
import { shallow } from "zustand/shallow";
import { useStore } from "../../contexts";
function Tree({ originalData, width = window.innerWidth }, svg) {
  const [ZOOM, setZOOM] = useState(0);
  //➡️全局数据
  const {
    setSelectNode,
    collapse,
    selectedNode,
    // selectedCodependency,
    selectedCircularDependency,
  } = useStore(
    (state) => ({
      setSelectNode: state.setSelectNode,
      collapse: state.collapse,
      selectedNode: state.selectedNode,
      // selectedCodependency: state.selectedCodependency,
      selectedCircularDependency: state.selectedCircularDependency,
    }),
    shallow,
  );
  //➡️改变内部数据不能检测，所以改为引用类型包裹以便更新
  const [data, setData] = useState(() => [filterData(originalData, collapse)]);
  const [offsetY, setOffsetY] = useState({});
  const [links, setLinks] = useState([]);
  //用来记录不影响重渲染的值
  let { current } = useRef({
    rootLength: 0,
  });
  useEffect(() => {
    const { offsetY, links, rootLength } = generateTree(data[0]);
    current.rootLength = rootLength;
    setOffsetY(offsetY);
    setLinks(links);
  }, [data]);
  //➡️
  //循环
  const [, setCirclePath] = useState("");
  //将循环的路径上的节点展开并高亮循环节点
  useEffect(() => {
    if (selectedCircularDependency) {
      setSelectNode(
        findDepBypath(selectedCircularDependency.path, originalData),
      );
    }
  }, [selectedCircularDependency]);
  //将循环节点连接
  useEffect(() => {
    if (
      selectedCircularDependency &&
      offsetY[selectedCircularDependency.path.join()]
    ) {
      const circleParentPath = [];
      selectedCircularDependency.path.some((path) => {
        circleParentPath.push(path);
        if (path === selectedCircularDependency.path.at(-1)) {
          return true;
        }
        return false;
      });
      const { x: x0, y: y0, width: width0 } = offsetY[circleParentPath.join()];
      const { x, y, width } = offsetY[selectedCircularDependency.path.join()];
      const x1 = y + width / 2,
        x2 = y0 + width0 / 2,
        y1 = x,
        y2 = x0;
      const path = d3.path();
      path.moveTo(x1, y1);
      path.lineTo(x2, y2);
      setCirclePath(path.toString());
    } else {
      setCirclePath("");
    }
  }, [offsetY]);
  //➡️
  //高亮
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
    function debounce(fn, wait) {
      let timer = null;
      return function (...args) {
        if (timer !== null) {
          clearTimeout(timer);
        }
        timer = setTimeout(() => {
          fn(args);
          timer = null;
        }, wait);
      };
    }

    function zoomed(e) {
      debounce(setZOOM(e.transform), 1000);
      d3.selectAll("#resizing").attr("transform", e.transform);
    }
    d3.select(svg.current).call(zoom).call(zoom.transform, d3.zoomIdentity);
  }, [curHighlight]);
  //界面适配
  useEffect(() => {
    window.addEventListener(
      "resize",
      throttle(() => {
        setData((pre) => [...pre]);
      }, 500),
    );
  }, []);
  //全部折叠/收起
  useEffect(() => {
    setData([filterData(originalData, collapse)]);
  }, [collapse]);
  return (
    <>
      <svg
        id="svgImg"
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
                strokeWidth={2}
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
        <g id="resizing" strokeLinejoin="round" strokeWidth={3}>
          {Object.values(offsetY).map((d) => {
            const {
              width,
              x,
              y,
              data: { highlight },
            } = d;
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
                <rect
                  fill="none"
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
                    fill={highlight ? "#1890ff" : "rgb(167,167,167)"}
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
      <Export svgRef={svg} width={width} height={innerHeight} ZOOM={ZOOM} />
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
//为第二层以下的节点添加originDeps字段
function filterData(data, collapse) {
  const cacheSet = new Set();
  let depth = 1;
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
      const child = traverse(dependency);
      if (depth <= 2 || !collapse) newData.dependencies[name] = child;
      newData.originDeps[name] = child;
    }
    return newData;
  }
  const root = traverse(data);
  return root;
}
//节流
const throttle = (func, delay = 500) => {
  let timer = null;
  return (...args) => {
    if (timer) return;
    timer = setTimeout(() => {
      func(...args);
      timer = null;
    }, delay);
  };
};

export default forwardRef(Tree);
