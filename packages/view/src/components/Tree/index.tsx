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
  const nodeCache = useRef(new Map());
  // false时不重绘，true时才可以重绘
  const graphRef = useRef(null);
  const canvasOuterDiv = useRef(null);
  const [data, setData] = useState(() => [filterData(root, collapse)]);
  const themeMemo = useRef(theme);
  const rootMemo = useRef(root);
  const depthMemo = useRef(globalDepth);
  const cache = useRef({
    selectedNodeMemoPath: "",
  });
  const scaleState = useRef({
    scale: 1,
    minScale: 0.4,
    maxScale: 6,
  });
  const selectedNodeMemo = useRef(selectedNode);
  const selectedCodependencyMemo = useRef(selectedCodependency);
  const selectedCircularDependencyMemo = useRef(selectedCircularDependency);
  // 把canvas和graph暴露出去，graph给Export组件用来下载图片
  useImperativeHandle(exposeRef, () => {
    return {
      canvasOuterDiv: canvasOuterDiv.current,
      graph: graphRef.current,
    };
  });
  //将循环的路径上的节点展开并高亮循环节点
  useEffect(() => {
    if (selectedCircularDependency) {
      setSelectNode({
        ...findDepBypath(selectedCircularDependency.path, root, true),
      });
    }
  }, [selectedCircularDependency]);
  useEffect(() => {
    selectedNodeMemo.current = selectedNode;
    cache.current.selectedNodeMemoPath = selectedNodeMemo.current.path.join();
  }, [selectedNode]);
  useEffect(() => {
    nodeCache.current.clear();
  }, [collapse]);
  useEffect(() => {
    themeMemo.current = theme;
    // 利用这个setState来让视图渲染，从而触发node更新，
    // 改变字体颜色
    setRoot({ ...root });
  }, [theme]);
  useEffect(() => {
    if (depthMemo.current !== globalDepth) {
      depthMemo.current = globalDepth;
      nodeCache.current.clear();
    }
  }, [globalDepth]);
  // 重复依赖改变，要展开
  useEffect(() => {
    selectedCodependencyMemo.current = selectedCodependency;
    // 展开
    if (selectedCodependency?.length) {
      const selectedNodes = selectedCodependency.map((node) => {
        const dep = findDepBypath(node.path, root, true);
        return dep;
      });
      setSelectNode(selectedNodes[0]);
    }
    setRoot({ ...root });
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
          //   console.log("渲染");
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
          //   console.log("更新");
          const group = item.getContainer();
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
              cache.current.selectedNodeMemoPath === group.cfg.id
                ? "#5B2EEE"
                : "rgb(167,167,167)",
          });
          updateCodependecyStyle(group);
          // 这里改变循环依赖样式，渲染的时候判断自己是否处在这条路径上，
          linkCircleDependency();
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
        // 1.只对选中的节点进行改变
        if (selectedNodeMemo.current) {
          const nowSelectedNode = findNodeByPath(
            cache.current.selectedNodeMemoPath,
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
    // 优化，没有选择重复依赖就不走逻辑
    if (selectedCodependencyMemo.current.length === 0) return;
    // 从重复依赖中查找它
    const model = group.cfg.item._cfg.model;
    const dep = selectedCodependencyMemo.current.find((codep) => {
      return codep.path.join() === model.path.join();
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
      // 如果循环依赖没有选择，就不触发
      if (!selectedCircularDependencyMemo.current) return;
      const { circlePath, name } = selectedCircularDependencyMemo.current;
      // 1.获取路径上所有循环的节点的路径
      // 保存所有循环路径的数组
      const circlePathArr = [];
      for (let i = 0; i < circlePath.length; ++i) {
        if (circlePath[i] === name) {
          circlePathArr.push(circlePath.slice(0, i + 1).join());
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
        const nodePath = path.join();
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
          const arrow = targetNode._cfg.group.find(
            (e) => e.get("name") === "custom-arrow-path",
          );
          arrow.toFront();
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
    // 优化，减少循环次数
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
  //   function onWheel(e) {
  //     e.preventDefault();
  //     const delta = -e.deltaY;
  //     const scaleFactor = 0.001;

  //     scaleState.current.scale = Math.max(
  //       scaleState.current.minScale,
  //       Math.min(
  //         scaleState.current.maxScale,
  //         scaleState.current.scale + delta * scaleFactor,
  //       ),
  //     );

  //     if (canvasOuterDiv.current) {
  //       canvasOuterDiv.current.style.transform = `scale(${scaleState.current.scale}) translate(${dragState.current.translateX}px, ${dragState.current.translateY}px)`;

  //       // 更新tooltip大小
  //       const tooltips = document.querySelectorAll(".tooltip");
  //       tooltips.forEach((tip) => {
  //         if (tip && tip.style) {
  //           tip.style.transform = `scale(${scaleState.current.scale})`;
  //         }
  //       });
  //     }
  //   }
  useEffect(() => {
    generateTree(data[0]);
  }, [data]);
  useEffect(() => {
    rootMemo.current = root;
    setData([filterData(root, undefined)]);
  }, [root]);
  useEffect(() => {
    setData([filterData(root, collapse)]);
  }, [collapse]);
  useEffect(() => {
    window.onresize = throttle(() => {
      if (graphRef.current) {
        // graphRef.current.changeSize(window.innerWidth, window.innerHeight);
        graphRef.current.fitCenter();
      }
    }, 1000);
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
    // if (!Data) return;
    // const width = window.innerWidth;
    // const height = window.innerHeight || 800;
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
          const content =
            model.name + "@" + model.version + "(" + model.version + ")";
          const dom = document.createElement("div");
          dom.style.color = "#8463F1";
          dom.style.whiteSpace = "nowrap";
          dom.style.webkitTextStrokeWidth = "1px";
          dom.style.webkitTextStrokeColor =
            themeMemo.current === "light" ? "none" : "#252529";
          dom.style.fontWeight = 700;
          dom.style.transform = `translate(0,-20px)`;
          dom.textContent = content;
          return dom;
        },
      });
      graphRef.current = new G6.TreeGraph({
        container: canvasOuterDiv.current,
        width: 8000,
        height: 8000,
        animate: false,
        fitView: false,
        plugins: [tooltip],
        modes: {
          default: [
            {
              type: "collapse-expand",
              enableOptimize: true,
              onChange(item, collapsed) {
                const data = item.getModel();
                data.collapsed = collapsed;
                return true;
              },
              shouldBegin(e) {
                // 若当前操作的节点 id 为 'node1'，则不发生 collapse-expand
                if (e.target && e.target.cfg.name === "collapse-icon")
                  return true;
                return false;
              },
            },
            // {
            //   type: "drag-canvas",
            // },
            {
              type: "zoom-canvas",
              sensitivity: 1.5,
              minZoom: 0.1,
              maxZoom: 6,
            },
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
        // console.log("id", model);
        if (e.target.cfg.name === "collapse-icon") {
          // 原本折叠就打开，原本打开就折叠
          setSelectNode(
            findDepBypath(model.path, rootMemo.current, !model.unfold),
          );
          //   console.log("删除前cache", nodeCache.current);
          // 将这个节点路径上的缓存全部清除
          let pathKey = "";
          const { path } = model;
          for (const s of path) {
            pathKey += s;
            // console.log("pathKey", pathKey);
            nodeCache.current.delete(pathKey);
          }
          //   console.log("删除后cache", nodeCache.current);
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
      // 动态tooltip字体大小
      graphRef.current.on("wheelzoom", () => {
        const tooltips = document.querySelectorAll(".tooltip");
        tooltips.forEach((tip) => {
          if (tip && tip.style) {
            tip.style.transform = `scale(${graphRef.current.getZoom()})`;
          }
        });
      });
      graphRef.current.data(Data);
      graphRef.current.render();
      // 添加这行代码，直接跳转到中心位置
      //   graphRef.current.translate(1500 - width / 2, 1500 - height / 2);
      graphRef.current.fitCenter();
      //   graphRef.current.translate(width / 2, 4500);
      //   graphRef.current.fitView();
      //   graphRef.current.get("canvas").set("localRefresh", true);
    }
    // 记录上一次的位置
    const lastPoint = graphRef.current.getCanvasByPoint(0, 0);
    graphRef.current.changeData(Data);
    // graphRef.current.fitView();
    // 渲染更新后记录新的位置，并且移动画布
    const newPoint = graphRef.current.getCanvasByPoint(0, 0);
    graphRef.current.translate(
      lastPoint.x - newPoint.x,
      lastPoint.y - newPoint.y,
    );
  }
  // 递归变为树需要的数据类型
  function converToTreeData(data) {
    // 先读缓存
    const cacheKey = data.path.join("");
    // console.log("cacheKey", cacheKey);
    if (nodeCache.current.has(cacheKey)) {
      //   console.log("利用缓存的节点");
      return nodeCache.current.get(cacheKey);
    }
    // 从0开始
    const depth = data.path.length;
    const parentNode = {
      path: data.path,
      name: data.name,
      // 根据dependenciesList是否存在来判断是否有子依赖，因为不选中的话
      // children是[]，无法拿来判断
      dependenciesList: depth < globalDepth ? data.dependenciesList : [],
      id: data.path.join(),
      unfold: data.unfold,
      version: data.version,
      declarationVersion: data.declarationVersion,
      description: data.description,
      children: [],
    };
    // 缓存
    // 没有孩子返回自己
    if (!data || !data?.dependencies || isEmpty(data?.dependencies))
      return parentNode;
    const children = [];
    const { dependencies } = data;
    for (const key in dependencies) {
      children.push(converToTreeData(dependencies[key]));
    }
    parentNode.children = children;
    nodeCache.current.set(cacheKey, parentNode);
    return parentNode;
  }
  // 在组件顶部添加拖拽状态ref
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    translateX: 0,
    translateY: 0,
  });

  // 实现onMouseDown函数
  // 在组件顶部添加mouseMoveHandler ref
  const mouseMoveHandler = useRef(null);

  // 修改onMouseDown函数
  function onMouseDown(e) {
    if (!canvasOuterDiv.current) return;

    dragState.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      translateX: parseInt(
        canvasOuterDiv.current.style.transform?.match(
          /translateX\(([^)]+)/,
        )?.[1] || 0,
      ),
      translateY: parseInt(
        canvasOuterDiv.current.style.transform?.match(
          /translateY\(([^)]+)/,
        )?.[1] || 0,
      ),
    };

    // 添加mousemove事件监听
    mouseMoveHandler.current = (e) => {
      if (!dragState.current.isDragging) return;

      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;

      canvasOuterDiv.current.style.transform = `
        translateX(${dragState.current.translateX + dx}px)
        translateY(${dragState.current.translateY + dy}px)
        scale(${scaleState.current.scale})
      `;
    };

    document.addEventListener("mousemove", mouseMoveHandler.current);
    document.addEventListener("mouseup", onMouseUp);
  }

  // 修改onMouseUp函数
  function onMouseUp(e) {
    if (!canvasOuterDiv.current || !dragState.current.isDragging) return;

    // 更新最终位置
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;

    dragState.current = {
      ...dragState.current,
      isDragging: false,
      translateX: dragState.current.translateX + dx,
      translateY: dragState.current.translateY + dy,
    };

    // 移除事件监听
    document.removeEventListener("mousemove", mouseMoveHandler.current);
    document.removeEventListener("mouseup", onMouseUp);
    mouseMoveHandler.current = null;
  }

  // 修改返回的div样式
  return (
    <div
      ref={canvasOuterDiv}
      id="graph"
      style={{
        transform: "translateX(-3600px) translateY(-3600px) scale(1)",
        willChange: "transform",
      }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      //   onWheel={onWheel}
    />
  );
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
