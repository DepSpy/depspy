import * as G6 from "@antv/g6";
import {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { shallow } from "zustand/shallow";
import { textOverflow } from "../../utils/textOverflow";
import { useStore } from "../../contexts";
import "./index.scss";
function Tree(props, exposeRef) {
  //➡️全局数据
  const {
    globalDepth,
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
      globalDepth: state.depth,
    }),
    shallow,
  );
  const graphRef = useRef(null);
  const svg = useRef(null);
  const [data, setData] = useState(() => [filterData(root, collapse)]);
  const themeMemo = useRef(theme);
  const rootMemo = useRef(root);
  const selectedNodeMemo = useRef(selectedNode);
  const selectedCodependencyMemo = useRef(selectedCodependency);
  const selectedCircularDependencyMemo = useRef(selectedCircularDependency);
  // 把canvas和graph暴露出去，graph给Export组件用来下载图片
  useImperativeHandle(exposeRef, () => {
    return {
      canvasOuterDiv: svg.current,
      graph: graphRef.current,
    };
  });
  //将循环的路径上的节点展开并高亮循环节点
  useEffect(() => {
    // console.warn("selectedCircularDependency改变", selectedCircularDependency);
    if (selectedCircularDependency) {
      setSelectNode({
        ...findDepBypath(selectedCircularDependency.path, root, true),
      });
    }
  }, [selectedCircularDependency]);
  useEffect(() => {
    // console.warn("选择节点改变", selectedNode);
    selectedNodeMemo.current = selectedNode;
  }, [selectedNode]);
  useEffect(() => {
    themeMemo.current = theme;
    // 利用这个setState来让视图渲染，从而触发node更新，
    // 改变字体颜色
    setRoot({ ...root });
  }, [theme]);
  // 重复依赖改变，要展开
  useEffect(() => {
    // console.warn("重复依赖改变", selectedCodependency);
    selectedCodependencyMemo.current = selectedCodependency;
    // 展开
    if (selectedCodependency?.length) {
      const selectedNodes = selectedCodependency.map((node) => {
        const dep = findDepBypath(node.path, root, true);
        return dep;
      });
      setSelectNode(selectedNodes[0]);
      setRoot({ ...root });
    } else {
      setRoot({ ...root });
    }
  }, [selectedCodependency]);
  useEffect(() => {
    selectedCircularDependencyMemo.current = selectedCircularDependency;
  }, [selectedCircularDependency]);
  // 初始化G6
  useEffect(() => {
    G6.registerNode(
      "tree-node",
      {
        drawShape: (cfg, group) => {
          const rect = group.addShape("rect", {
            attrs: {
              x: 0,
              y: 0,
              fill: themeMemo.current === "light" ? "white" : "#252529",
              width: 100,
              height: 20,
              stroke: "rgb(167,167,167)",
              radius: 5,
              cursor: "pointer",
            },
            name: "tree-rect-shape",
          });
          const content = textOverflow(cfg.path[cfg.path.length - 1], 100);
          const text = group.addShape("text", {
            attrs: {
              text: content,
              fill: "#fff",
              cursor: "pointer",
            },
            name: "tree-text-shape",
          });
          const tbox = text.getBBox();
          const rbox = rect.getBBox();
          // dependenciesList需要在convert的时候跟globalDep比较一下判断是否加入
          const hasChildren = cfg.children && !isEmpty(cfg.dependenciesList);
          text.attr({
            x: (rbox.width - tbox.width) / 2,
            y: (rbox.height + tbox.height) / 2,
          });
          // 有子节点，显示+-号
          if (hasChildren && cfg.name !== "dep-spy") {
            group.addShape("marker", {
              attrs: {
                x: rbox.width + 8,
                y: 0,
                r: 6,
                cursor: "pointer",
                // 图案
                symbol: cfg.collapsed ? G6.Marker.expand : G6.Marker.collapse,
                stroke: "rgb(167,167,167)",
                lineWidth: 1,
              },
              name: "collapse-icon",
            });
          }
          return rect;
        },
        update: (cfg, item) => {
          const group = item.getContainer();
          //   const model = group.cfg.item._cfg.model;
          const textColor = themeMemo.current === "light" ? "black" : "white";
          const icon = group.find((e) => {
            return e.get("name") === "collapse-icon";
          });
          icon?.attr(
            "symbol",
            cfg.unfold ? G6.Marker.collapse : G6.Marker.expand,
          );
          // 改变字体颜色
          const text = group.find((e) => e.get("name") === "tree-text-shape");
          text?.attr({
            fill: textColor,
          });
          // 改变rect的fill，以便于hover触发
          const rect = group.find((e) => e.get("name") === "tree-rect-shape");
          rect?.attr({
            fill: themeMemo.current === "light" ? "white" : "#252529",
            stroke:
              selectedNodeMemo.current.path.join("-") === group.cfg.id
                ? "#5B2EEE"
                : "rgb(167,167,167)",
          });
          console.log(selectedNodeMemo.current, group);
          updateCodependecyStyle(group);
          // 这里改变循环依赖样式，渲染的时候判断自己是否处在这条路径上，
          linkCircleDependency();
        },
        getAnchorPoints: () => {
          return [
            [0, 0.5],
            [1, 0.5],
          ];
        },
      },
      "single-node",
    );
    G6.registerEdge("tree-polyline", {
      draw(cfg, group) {
        const startPoint = cfg.startPoint;
        const endPoint = cfg.endPoint;
        const shape = group.addShape("path", {
          attrs: {
            stroke: "rgb(167,167,167)",
            path: [
              ["M", startPoint.x, startPoint.y],
              ["L", endPoint.x / 3 + (2 / 3) * startPoint.x, startPoint.y], // 三分之一处
              ["L", endPoint.x / 3 + (2 / 3) * startPoint.x, endPoint.y], // 三分之二处
              ["L", endPoint.x, endPoint.y],
            ],
            endArrow: true,
          },
          // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
          name: "custom-polyline-path",
        });
        return shape;
      },
      update() {
        // 1.获取当前选择节点
        if (selectedNodeMemo.current) {
          const nowSelectedNode = findNodeByPath(
            selectedNodeMemo.current.path.join(),
          );
          // 2.获取当前节点邻近的edge，将他们全部变色
          const neighborEdges = nowSelectedNode?.getEdges();
          neighborEdges?.forEach((edge) => {
            const findEdge = edge._cfg.group.find(
              (e) => e.get("name") === "custom-polyline-path",
            );
            findEdge?.attr({
              stroke: "#5B2EEE",
            });
          });
        }
      },
    });
  }, []);
  // 更新重复依赖样式
  function updateCodependecyStyle(group) {
    // 从重复依赖中查找它
    const model = group.cfg.item._cfg.model;
    const dep = selectedCodependencyMemo.current.find((codep) => {
      return codep.path.join("-") === model.path.join("-");
    });
    // 这里是改变重复依赖的样式
    if (dep) {
      const rect = group.find((e) => {
        return e.get("name") === "tree-rect-shape";
      });
      rect.attr({
        stroke: "#5B2EEE",
        fill: "#5B2EEE",
      });
    }
  }
  // 连接循环依赖
  function linkCircleDependency() {
    if (selectedCircularDependencyMemo.current) {
      const { circlePath, name } = selectedCircularDependencyMemo.current;
      // 1.获取路径上所有循环的节点的路径
      // 保存所有循环路径的数组
      const circlePathArr = [];
      for (let i = 0; i < circlePath.length; ++i) {
        if (circlePath[i] === name) {
          circlePathArr.push(circlePath.slice(0, i + 1).join("-"));
        }
      }
      // 2.根据路径获取所有节点
      // 存放所有节点，最后一个必是箭头出发点
      const allCircleDepNodesArr = [];
      const nodes = graphRef.current.getNodes();
      nodes?.forEach((node) => {
        const {
          _cfg: {
            model: { path },
          },
        } = node;
        const nodePath = path.join("-");
        // 将在路径上的重复节点加入数组，循环画箭头，并且
        // 在这里设置节点样式
        if (circlePathArr.indexOf(nodePath) !== -1) {
          // 设置样式
          const rect = node._cfg.group.find((e) => {
            return e.get("name") === "tree-rect-shape";
          });
          rect?.attr({
            stroke: "#5B2EEE",
          });
          allCircleDepNodesArr.push(node);
        }
      });
      // 3.开始画箭头
      if (allCircleDepNodesArr.length >= 2) {
        // 箭头起点节点
        const sourceNode =
          allCircleDepNodesArr[allCircleDepNodesArr.length - 1];
        const sourceNodeModel = sourceNode.getModel();
        const sourceNodeCenter = [sourceNodeModel.x, sourceNodeModel.y];
        // 给每个节点画上箭头
        for (let i = 0; i < allCircleDepNodesArr.length - 1; ++i) {
          const targetNode = allCircleDepNodesArr[i];
          const targetNodeModel = targetNode.getModel();
          // 获取节点中心坐标
          const targetNodeCenter = [targetNodeModel.x, targetNodeModel.y];
          // 画箭头
          // 这个路径是以所添加的节点本身左上角为(0,0)
          const arrowPath = createArrowPath(
            sourceNodeCenter[0] - targetNodeCenter[0] + 50,
            sourceNodeCenter[1] - targetNodeCenter[1] + 10,
            50,
            10,
          );
          targetNode._cfg.group.addShape("path", {
            attrs: {
              path: arrowPath,
              stroke: "#E3696A",
              lineWidth: 2,
            },
            name: "custom-arrow-path",
          });
        }
      }
    }
  }
  // 产生链接循环依赖的path
  function createArrowPath(x1, y1, x2, y2, arrowSize = 10) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) {
      return "M0,0";
    }
    const unitDx = dx / length;
    const unitDy = dy / length;
    // 计算箭头的底边中点坐标
    const arrowBaseMidX = x2 - arrowSize * 0.5 * unitDx;
    const arrowBaseMidY = y2 - arrowSize * 0.5 * unitDy;
    // 计算箭头的两个顶点坐标
    const arrowX2 = arrowBaseMidX - arrowSize * 0.5 * unitDy;
    const arrowY2 = arrowBaseMidY + arrowSize * 0.5 * unitDx;
    const arrowX3 = arrowBaseMidX + arrowSize * 0.5 * unitDy;
    const arrowY3 = arrowBaseMidY - arrowSize * 0.5 * unitDx;
    return `M${x1},${y1} L${x2},${y2} M${x2},${y2} L${arrowX2},${arrowY2} L${arrowX3},${arrowY3} Z`;
  }
  // 传递path，找到对应的node
  function findNodeByPath(findPath) {
    let returnNode;
    if (graphRef.current) {
      const nodes = graphRef.current.getNodes();
      nodes?.forEach((node) => {
        if (returnNode) return;
        const {
          _cfg: {
            model: { path },
          },
        } = node;
        if (findPath === path.join()) {
          returnNode = node;
          return;
        }
      });
    }
    return returnNode;
  }
  useEffect(() => {
    // console.warn("data改变", data[0]);
    generateTree(data[0]);
  }, [data]);
  useEffect(() => {
    // console.warn("root改变", root);
    rootMemo.current = root;
    setData([filterData(root, undefined)]);
  }, [root]);
  useEffect(() => {
    // console.warn("collapse改变");
    setData([filterData(root, collapse)]);
  }, [collapse]);
  useEffect(() => {
    window.onresize = throttle(() => {
      if (graphRef.current) {
        graphRef.current.changeSize(window.innerWidth, window.innerHeight);
        graphRef.current.fitView();
      }
    }, 500);
    return () => {
      window.onresize = null;
    };
  }, []);
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
        return {};
      }
      if (typeof collapse === "boolean") {
        data.unfold = !collapse;
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
        if (
          depth <= 2 ||
          (typeof collapse === "boolean" && !collapse) ||
          newData.unfold
        ) {
          newData.unfold = true;
          newData.dependencies[name] = child;
        }
        newData.originDeps[name] = child;
      }
      depth--;
      return newData;
    }
    const root = traverse(data);
    return root;
  }

  function generateTree(data) {
    const Data = converToTreeData(data);
    // console.log("进入的data", data);
    const width = window.innerWidth;
    const height = window.innerHeight || 800;
    if (!graphRef.current) {
      // 增加hover提示框
      const tooltip = new G6.Tooltip({
        // offsetY: -30,
        // fixToNode: [0, 0],
        className: "tooltip",
        itemTypes: ["node"],
        getContent(e) {
          const {
            item: {
              _cfg: { model },
            },
          } = e;
          const zoom = graphRef.current.getZoom();
          const content =
            model.name + "@" + model.version + "(" + model.version + ")";
          const dom = document.createElement("div");
          dom.style.color = "#8463F1";
          dom.style.whiteSpace = "nowrap";
          // 动态字体大小
          dom.style.fontSize = 16 * zoom + "px";
          dom.style.webkitTextStrokeWidth = "1px";
          dom.style.webkitTextStrokeColor =
            themeMemo.current === "light" ? "none" : "#252529";
          dom.style.fontWeight = 700;
          dom.style.transform = `translate(0,${-30 * zoom}px)`;
          dom.textContent = content;
          return dom;
        },
      });
      graphRef.current = new G6.TreeGraph({
        container: svg.current,
        width,
        height,
        animate: false,
        fitView: false,
        plugins: [tooltip],
        modes: {
          default: [
            {
              type: "collapse-expand",
              onChange(item, collapsed) {
                const data = item.getModel();
                data.collapsed = collapsed;
                return true;
              },
              shouldBegin(e) {
                // console.log("判断shouldbegin", e);
                // 若当前操作的节点 id 为 'node1'，则不发生 collapse-expand
                if (e.target && e.target.cfg.name === "collapse-icon")
                  return true;
                return false;
              },
            },
            "drag-canvas",
            "zoom-canvas",
          ],
        },
        defaultNode: {
          type: "tree-node",
          anchorPoints: [
            [0, 0.5],
            [1, 0.5],
          ],
        },
        defaultEdge: {
          type: "tree-polyline",
        },
        layout: {
          type: "compactBox",
          direction: "LR",
          getId: function getId(d) {
            return d.id;
          },
          getHeight: function getHeight() {
            return 16;
          },
          getWidth: function getWidth() {
            return 16;
          },
          getVGap: function getVGap() {
            return 10;
          },
          getHGap: function getHGap() {
            return 100;
          },
        },
      });
      graphRef.current.on("node:click", (e) => {
        if (!e.target) return;
        graphRef.current.focusItem(e.item);
        const cfg = e.item._cfg;
        const model = cfg.model;
        e.stopPropagation();
        e.preventDefault();
        // 只有点击+ - 号才展开
        if (e.target.cfg.name === "collapse-icon") {
          // console.log("e", e, "e.item", e.item);
          // 原本折叠就打开，原本打开就折叠
          setSelectNode(
            findDepBypath(model.path, rootMemo.current, !model.unfold),
          );
          //   model.unfold = !model.unfold;
          // 点击矩形部分就只改变邻居edges的颜色
        } else if (
          e.target.cfg.name === "tree-rect-shape" ||
          e.target.cfg.name === "tree-text-shape"
        ) {
          setSelectNode(
            findDepBypath(model.path, rootMemo.current, model.unfold),
          );
        }
        setRoot({ ...rootMemo.current });
      });
      graphRef.current.data(Data);
      graphRef.current.render();
      graphRef.current.fitView();
    }
    // 记录上一次的位置
    const lastPoint = graphRef.current.getCanvasByPoint(0, 0);
    graphRef.current.changeData(Data);
    // 渲染更新后记录新的位置，并且移动画布
    const newPoint = graphRef.current.getCanvasByPoint(0, 0);
    graphRef.current.translate(
      lastPoint.x - newPoint.x,
      lastPoint.y - newPoint.y,
    );
    // console.log("Data:", Data);
  }
  // 递归变为树需要的数据类型
  function converToTreeData(data) {
    // 从0开始
    const depth = data.path.length;
    const parentNode = {
      path: data.path,
      name: data.name,
      // 根据dependenciesList是否存在来判断是否有子依赖，因为不选中的话
      // children是[]，无法拿来判断
      dependenciesList: depth < globalDepth ? data.dependenciesList : [],
      id: data.path.join("-"),
      unfold: data.unfold,
      version: data.version,
      declarationVersion: data.declarationVersion,
      description: data.description,
      children: [],
    };
    //   const parentNode = { ...data, children: [] };
    // 没有孩子返回自己
    if (!data || !data?.dependencies || isEmpty(data?.dependencies))
      return parentNode;
    const children = [];
    const { dependencies } = data;
    for (const key in dependencies) {
      children.push(converToTreeData(dependencies[key]));
    }
    parentNode.children = children;
    return parentNode;
  }
  return <div ref={svg} id="graph" />;
}

// 判断对象是否为空
function isEmpty(obj) {
  if (!obj) return true;
  return Object.keys(obj).length === 0;
}

function findDepBypath(paths, data, finnalUnFold) {
  if (paths.length == 1) {
    if (finnalUnFold != undefined) data.unfold = finnalUnFold; // 当前选择节点是否展开
    return data;
  }
  let parent = data;
  let dep = data;

  paths.slice(1).forEach((path) => {
    if (!parent.dependencies[path]) {
      if (parent.originDeps) parent.dependencies = parent.originDeps;
      else return;
    }
    dep = parent.dependencies[path] ? parent.dependencies[path] : dep;
    parent = dep;
    if (finnalUnFold != undefined) dep.unfold = true; //标记为展开
  });
  if (finnalUnFold != undefined) dep.unfold = finnalUnFold; // 当前选择节点是否展开

  return dep;
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
