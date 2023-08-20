import * as d3 from "d3";
import { useEffect, useState, useRef, useReducer } from "react";
import { useStore } from "../../contexts";
export function Tree({ originalData, width = window.innerWidth }) {
  //➡️全局数据
  const {
    setSelectNode,
    selectedNode,
    selectedCodependency,
    selectedCircularDependency,
  } = useStore((state) => ({
    setSelectNode: state.setSelectNode,
    selectedNode: state.selectedNode,
    selectedCodependency: state.selectedCodependency,
    selectedCircularDependency: state.selectedCircularDependency,
  }));
  //➡️改变内部数据不能检测，所以改为引用类型包裹以便更新
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
  }, [data]);
  //➡️
  //循环
  const [circlePath, setCirclePath] = useState("");
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
  const svg = useRef(null);
  const [curHighlight, setCurHighlight] = useReducer((cur, nextPath) => {
    const nextHighLight = findDepBypath(nextPath, data[0]);
    cur.highlight = false;
    nextHighLight.highlight = true;
    setData([...data]);
    return nextHighLight;
  }, {});
  //高亮选中节点
  useEffect(() => {
    const nextPath = selectedNode.path;
    setCurHighlight(nextPath);
  }, [selectedNode]);
  //高亮相同依赖
  useEffect(() => {
    if (selectedCodependency?.length) {
      selectedCodependency.forEach((node) => {
        findDepBypath(node.path, data[0]);
      });
      setSelectNode(selectedCodependency[0]);
    }
  }, [selectedCodependency]);
  //➡️
  //绑定缩放事件
  useEffect(() => {
    const zoom = d3.zoom().scaleExtent([0.1, 5]).on("zoom", zoomed);

    function zoomed(e) {
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
                  .link(d3.curveStep)
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
              depth,
              data: {
                highlight,
                name,
                declarationVersion,
                version,
                dependencies,
                originDeps,
              },
            } = d;
            const declarationId = `${name}@${declarationVersion || version}`;
            const id = `${name}@${version}`;
            const coId = `${selectedCodependency[0]?.name}@${selectedCodependency[0]?.version}`;
            const isCo = coId == id;
            const collapseFlag = Object.values(originDeps).length
              ? Object.values(dependencies).length
                ? "-"
                : "+"
              : "";
            if (highlight) {
              d3.select(svg.current).attr(
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
                <title>
                  {id}({declarationVersion})
                </title>
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
                <foreignObject x={-width / 2} y="-15" width={width} height="30">
                  <div
                    style={{
                      display: "inline-block",
                      textAlign: "center",
                      color: isCo ? "white" : "black",
                      lineHeight: 1,
                      padding: 7.5,
                      width,
                      fontSize: 15,
                      height: 30,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    xmlns="http://www.w3.org/1999/xhtml"
                  >
                    {declarationId}
                  </div>
                  <div xmlns="http://www.w3.org/1999/xhtml"></div>
                </foreignObject>
                {Object.values(originDeps).length && depth && (
                  <g
                    transform={`translate(${width / 2 + 2},${-32})`}
                    onClick={() => {
                      const currentNode = findDepBypath(d.data.path, data[0]);
                      if (collapseFlag == "+") {
                        currentNode.dependencies = currentNode.originDeps;
                      } else {
                        currentNode.dependencies = {};
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
//生成渲染所需要的数据
function generateTree(data) {
  //形成d3的分层结构
  const root = d3.hierarchy(data, (d) => {
    return Object.values(d.dependencies);
  });
  let rootLength = 0;
  //形成树结构
  const tree = d3.tree().nodeSize([50, 200]);
  tree(root);
  //动态计算偏移量
  root.eachBefore((d) => {
    const nodeWidth = 150;
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
  if (paths.length == 1) return data;
  let parent = data;
  let dep = data;
  paths.slice(1).forEach((path) => {
    if (!parent.dependencies[path]) {
      parent.dependencies = parent.originDeps;
    }
    dep = parent.dependencies[path];
    parent = dep;
  });
  return dep;
}
//为第二层以下的节点添加originDeps字段
function filterCache(data) {
  let depth = 1;
  function traverse(data) {
    const newData = {
      ...data,
      originDeps: { ...data.dependencies },
      dependencies: { ...data.dependencies },
    };
    if (depth > 1) newData.dependencies = {};
    const entries = Object.entries(newData.originDeps);
    depth++;
    for (let i = 0; i < entries.length; i++) {
      const [name, dependency] = entries[i];
      const child = traverse(dependency);
      if (depth <= 2) newData.dependencies[name] = child;
      newData.originDeps[name] = child;
    }
    depth--;
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
