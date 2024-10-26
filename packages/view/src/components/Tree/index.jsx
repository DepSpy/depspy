import * as d3 from "d3";
import { useEffect, useState, useRef, useReducer, forwardRef } from "react";
import { shallow } from "zustand/shallow";
import { getActualWidthOfChars, textOverflow } from "../../utils/textOverflow";
import { useStore } from "../../contexts";
import SvgComponents from "./SvgComponents";
import "./index.scss";
function Tree({ width = window.innerWidth }, svg) {
  //➡️全局数据
  const {
    theme,
    root,
    setSelectNode,
    collapse,
    selectedNode,
    selectedCodependency,
    selectedCircularDependency,
    setRoot,
  } = useStore(
    (state) => ({
      theme: state.theme,
      root: state.root,
      setSelectNode: state.setSelectNode,
      collapse: state.collapse,
      selectedNode: state.selectedNode,
      selectedCodependency: state.selectedCodependency,
      selectedCircularDependency: state.selectedCircularDependency,
      setRoot: state.setRoot,
    }),
    shallow,
  );
  //➡️改变内部数据不能检测，所以改为引用类型包裹以便更新
  const [data, setData] = useState(() => [filterData(root, collapse)]);
  const [offsetY, setOffsetY] = useState({});
  const [links, setLinks] = useState([]);
  const preHighlight = useRef([]);
  useEffect(() => {
    setData([filterData(root, collapse)]);
  }, [root, collapse]);
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
      setSelectNode({
        ...findDepBypath(selectedCircularDependency.path, root, true),
      });
    } else {
      setCirclePath("");
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
  //高亮选中节点
  useEffect(() => {
    const nextPath = selectedNode.path;
    setCurHighlight(nextPath);
  }, [selectedNode, root]);
  //高亮相同依赖
  useEffect(() => {
    if (selectedCodependency?.length) {
      const selectedNodes = selectedCodependency.map((node) => {
        const dep = findDepBypath(node.path, root, true);
        dep.highlight = true;
        return dep;
      });
      useStore.subscribe(
        (state) => state.selectedCodependency,
        () => {
          preHighlight.current.forEach((node) => {
            node.highlight = false;
          });
        },
      );
      preHighlight.current = selectedNodes;

      setSelectNode(selectedNodes[0]);
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
                dependenciesList,
                unfold,
              },
            } = d;

            const declarationId = `${name}@${declarationVersion || version}`;
            const id = `${name}@${version}`;
            const coId = `${selectedCodependency[0]?.name}@${selectedCodependency[0]?.version}`;
            const isCo = coId == id;
            const hoverText = `${id}(${declarationVersion || version})`;
            const hoverTextLength = getActualWidthOfChars(hoverText);
            const text = textOverflow(declarationId, 130);
            const textLength = getActualWidthOfChars(text);
            console.log(unfold);
            
            const collapseFlag = Object.values(dependenciesList).length || Object.values(originDeps).length
              ? unfold
                ? "-"
                : "+"
              : "";

            if (highlight) {
              d3.select(svg.current).attr(
                "viewBox",
                `${y + width / 2 - innerWidth / 2}, ${x - innerHeight / 2
                }, ${innerWidth}, ${innerHeight}`,
              );
            }
            return (
              <g
                cursor={"pointer"}
                transform={`translate(${y + width / 2},${x})`}
                onClick={() => {
                  setSelectNode(findDepBypath(d.data.path, root));
                }}
              >
                <g>
                  {Object.values(originDeps).length && depth && (
                    <g
                      fill={
                        d.data.highlight
                          ? "rgb(91, 46, 238)"
                          : "rgb(167,167,167)"
                      }
                      pointerEvents={"auto"}
                      transform={`translate(${width / 2 + 2},${-32})`}
                      onClick={(e) => {
                        // 阻止触发父级
                        e.stopPropagation();

                        const currentNode = findDepBypath(d.data.path, root, collapseFlag == "+");
                        console.log('我执行了', collapseFlag == "+");
                        
                        
                        if (selectedNode !== currentNode) {
                          setSelectNode(currentNode);
                        }
                          setRoot({ ...root });

                      }}
                    >
                      {collapseFlag == "+" ? (
                        <use
                          href="#carbon-add-alt"
                          width={25}
                          height={25}
                        ></use>
                      ) : (
                        <use
                          href="#carbon-subtract-alt"
                          width={25}
                          height={25}
                        ></use>
                      )}
                    </g>
                  )}
                </g>
                <g className="tip">
                  <rect
                    fill={isCo ? "rgb(91, 46, 238)" : "transparent"}
                    stroke={
                      highlight || isCo
                        ? "rgb(91, 46, 238)"
                        : "rgb(167,167,167)"
                    }
                    strokeWidth={2}
                    width={width}
                    height={30}
                    rx={5}
                    ry={5}
                    transform={`translate(${-width / 2},${-15})`}
                  ></rect>
                  <text
                    transform={`translate(${-textLength / 2},${6.5})`}
                    stroke="none"
                    fill={isCo | (theme == "dark") ? "white" : "black"}
                  >
                    {text}
                  </text>
                  <g>
                    <text
                      fill="none"
                      strokeWidth={5}
                      transform={`translate(${-hoverTextLength / 2},${-20})`}
                    >
                      {hoverText}
                    </text>
                    <text
                      stroke="none"
                      transform={`translate(${-hoverTextLength / 2},${-20})`}
                    >
                      {hoverText}
                    </text>
                  </g>
                </g>
              </g>
            );
          })}
          <path
            d={circlePath}
            strokeWidth={2}
            stroke="red"
            markerEnd="url(#triangleRed)"
          ></path>
        </g>
      </svg>
      <SvgComponents />
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
  if (!rootLinks.length) {
    offsetY[root.data.path.join()] = root;
  }
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
function findDepBypath(paths, data, finnalUnFold) {
  console.log('findDepByPath');
  
  if (paths.length == 1) return data;
  let parent = data;
  let dep = data;

  paths.slice(1).forEach((path) => {

    if (!parent.dependencies[path]) {
      if (parent.originDeps) parent.dependencies = parent.originDeps;
      else return;
    }
    dep = parent.dependencies[path] ? parent.dependencies[path] : dep;
    parent = dep;
    if(finnalUnFold != undefined)  dep.unfold = true; //标记为展开
  });
  if(finnalUnFold != undefined) dep.unfold = finnalUnFold;// 当前选择节点是否展开

  return dep;
}
//为第二层以下的节点添加originDeps字段
/**
 *
 * @param {*} data
 * @param {Boolean} collapse 是否折叠
 * @returns
 */
function filterData(data, collapse) {
  let depth = 1;

  function traverse(data) {
    if (!data) {
      return {}
    }
    const newData = {
      ...data,
      originDeps: { ...data.dependencies },
      dependencies: { ...data.dependencies },
    };

    if (depth > 1) newData.dependencies = {};
    if (data.unfold) newData.unfold = true;
    const entries = Object.entries(newData.originDeps);
    depth++;
    for (let i = 0; i < entries.length; i++) {
      const [name, dependency] = entries[i];
      const child = traverse(dependency);
      // collapse命中展开所有, unfold命中展开当前
      if (depth <= 2 || !collapse || newData.unfold)
        newData.dependencies[name] = child;
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

export default forwardRef(Tree);
