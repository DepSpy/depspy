import { useEffect, useRef, useState, useCallback } from "react";
import * as G6 from "@antv/g6";
import { useStaticStore, useStore } from "@/contexts";
import { textOverflow } from "../../utils/textOverflow";
import { shallow } from "zustand/shallow";
import { State, COLOR } from "./constant";
import { deepClone } from "@/utils/deepClone";
import { throttle } from "@/utils/throttle";
import { extractFileName } from "@/pages/StaticAnalyzePage/utils";

export default function StaticTree() {
  const {
    staticRoot,
    showGitChangedNodes,
    showImportChangedNodes,
    gitChangedNodes,
    importChangedNodes,
    // setStaticRoot,
    setHighlightedNodeIds,
    highlightedNodeIds,
  } = useStaticStore(
    (state) => ({
      staticRoot: state.staticRoot,
      showGitChangedNodes: state.showGitChangedNodes,
      showImportChangedNodes: state.showImportChangedNodes,
      setShowGitChangedNodes: state.setShowGitChangedNodes,
      gitChangedNodes: state.gitChangedNodes,
      importChangedNodes: state.importChangedNodes,
      setStaticRoot: state.setStaticRoot,
      highlightedNodeIds: state.highlightedNodeIds,
      setHighlightedNodeIds: state.setHighlightedNodeIds,
    }),
    shallow,
  );
  const { theme } = useStore(
    (state) => ({
      theme: state.theme,
    }),
    shallow,
  );
  const graphRef = useRef<G6.TreeGraph>();
  const [cloneData, setCloneData] = useState();
  const [circleMap, setCircleMap] = useState(new Map());
  const highlightedNodeIdsRef = useRef(highlightedNodeIds);
  const containerRef = useRef<HTMLDivElement>();
  const showGitChangedNodesRef = useRef(showGitChangedNodes);
  const showImportChangedNodesRef = useRef(showImportChangedNodes);
  const gitChangedNodesRef = useRef(gitChangedNodes);
  const importChangedNodesRef = useRef(importChangedNodes);

  // console.log(staticRoot);

  useEffect(() => {
    // setCloneData(cloneData);
    if (!graphRef.current) return;
    const matrix = graphRef.current.getGroup().getMatrix();
    const zoom = graphRef.current.getZoom();
    const offsetX = matrix[6] / zoom;
    const offsetY = matrix[7] / zoom;

    G6RegisterNode();
    // 生成新的nodeStateStyles配置
    const newNodeStateStyles = {
      highlight: {
        stroke: theme === "dark" ? COLOR.DARK.HIGHLIGHT : COLOR.LIGHT.HIGHLIGHT,
        lineWidth: 2,
      },
      gitChanged: {
        stroke: theme === "dark" ? COLOR.DARK.GIT : COLOR.LIGHT.GIT,
        lineWidth: 2,
      },
      importChanged: {
        stroke: theme === "dark" ? COLOR.DARK.IMPORT : COLOR.LIGHT.IMPORT,
        lineWidth: 2,
      },
    };

    // 更新图的nodeStateStyles配置
    graphRef.current.set("nodeStateStyles", newNodeStateStyles);

    // 遍历所有节点，重新应用当前状态以更新样式
    graphRef.current.getNodes().forEach((node) => {
      const states = node.getStates();
      states.forEach((state) => {
        // 先取消状态，再重新激活以应用新样式
        graphRef.current.setItemState(node, state, false);
        graphRef.current.setItemState(node, state, true);
      });
    });
    graphRef.current.changeData(cloneData);

    circleMap.forEach((k, v) => {
      if (graphRef.current.findById(v) && graphRef.current.findById(k)) {
        graphRef.current.addItem("edge", {
          source: k,
          target: v,
          type: "circle-line",
        });
      }
    });

    //保持节点位置不变
    graphRef.current.translate(offsetX, offsetY);
    graphRef.current.zoom(zoom);
    graphRef.current.refresh();
    clearHighlight();
    showGitChangedNodes && handleNodeState(gitChangedNodes, State.GIT, true);
    showImportChangedNodes &&
      handleNodeState(importChangedNodes, State.IMPORT, true);
  }, [theme]);

  //注册自定节点和边
  function G6RegisterNode() {
    // 注册module节点
    G6.registerNode(
      "tree-node",
      {
        drawShape: function drawShape(cfg, group) {
          const rect = group.addShape("rect", {
            attrs: {
              x: 0,
              y: 0,
              width: 100,
              height: 20,
              fill: "transparent", // 添加透明填充色确保点击区域覆盖整个矩形
              stroke: theme === "dark" ? COLOR.DARK.SIMPLE : COLOR.LIGHT.SIMPLE,
              radius: 5,
            },
            // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
            name: "rect-shape",
          });
          const content = textOverflow(
            extractFileName(cfg.relativeId as string),
            100,
          );
          const text = group.addShape("text", {
            attrs: {
              text: content,
              fill: theme === "dark" ? "#ffffffd9" : "#000000e0",
            },
            // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
            name: "text-shape",
          });
          const tbox = text.getBBox();
          const rbox = rect.getBBox();
          const hasChildren =
            Array.isArray(cfg.children) && cfg.children.length > 0;
          text.attr({
            x: (rbox.width - tbox.width) / 2,
            y: (rbox.height + tbox.height) / 2,
          });
          if (hasChildren) {
            group.addShape("marker", {
              attrs: {
                x: rbox.width + 8,
                y: 0,
                r: 6,
                symbol: cfg.collapsed ? G6.Marker.expand : G6.Marker.collapse,
                stroke:
                  theme === "dark" ? COLOR.DARK.SIMPLE : COLOR.LIGHT.SIMPLE,
                lineWidth: 1,
              },
              // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
              name: "collapse-icon",
            });
          }
          return rect;
        },
        update: (cfg, item) => {
          const group = item.getContainer();
          const icon = group.find((e) => e.get("name") === "collapse-icon");
          icon?.attr(
            "symbol",
            cfg.collapsed ? G6.Marker.expand : G6.Marker.collapse,
          );
        },
      },
      "single-node",
    );
    // 注册线节点
    G6.registerEdge("custom-polyline", {
      draw(cfg, group) {
        const startPoint = cfg.startPoint;
        const endPoint = cfg.endPoint;

        let strokeColor =
          theme === "dark" ? COLOR.DARK.SIMPLE : COLOR.LIGHT.SIMPLE;
        const edge = group.get("item");
        if (edge.hasState(State.HIGHLIGHTE)) {
          strokeColor =
            theme === "dark" ? COLOR.DARK.HIGHLIGHT : COLOR.LIGHT.HIGHLIGHT;
        } else if (edge.hasState(State.GIT)) {
          strokeColor = theme === "dark" ? COLOR.DARK.GIT : COLOR.LIGHT.GIT;
        } else if (edge.hasState(State.IMPORT)) {
          strokeColor =
            theme === "dark" ? COLOR.DARK.IMPORT : COLOR.LIGHT.IMPORT;
        }
        const shape = group.addShape("path", {
          attrs: {
            stroke: strokeColor,
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
    });
    // 注册循环线节点
    G6.registerEdge("circle-line", {
      draw(cfg, group) {
        const { startPoint, endPoint } = cfg;

        let strokeColor = "red";
        const edge = group.get("item");
        if (edge.hasState(State.HIGHLIGHTE)) {
          strokeColor =
            theme === "dark" ? COLOR.DARK.HIGHLIGHT : COLOR.LIGHT.HIGHLIGHT;
        } else if (edge.hasState(State.GIT)) {
          strokeColor = theme === "dark" ? COLOR.DARK.GIT : COLOR.LIGHT.GIT;
        } else if (edge.hasState(State.IMPORT)) {
          strokeColor =
            theme === "dark" ? COLOR.DARK.IMPORT : COLOR.LIGHT.IMPORT;
        }
        const shape = group.addShape("line", {
          attrs: {
            x1: startPoint.x,
            y1: startPoint.y,
            x2: endPoint.x,
            y2: endPoint.y,
            stroke: strokeColor,
            lineWidth: 2, // 线宽
            // endArrow: true,
          },
          name: "circle-line-path",
        });
        return shape;
      },
    });
  }

  useEffect(() => {
    //清除所有item的高亮状态
    highlightedNodeIdsRef.current = highlightedNodeIds;
    if (!highlightedNodeIds || !graphRef.current) return;
    const nodes = graphRef.current.getNodes();
    const edges = graphRef.current.getEdges();
    nodes.forEach((node) => {
      graphRef.current.setItemState(node, State.HIGHLIGHTE, false);
      graphRef.current.refreshItem(node);
    });
    edges.forEach((edge) => {
      graphRef.current.setItemState(edge, State.HIGHLIGHTE, false);
      graphRef.current.refreshItem(edge);
    });

    highlightNodesSequentially();
    // graphRef.current.refresh();
  }, [highlightedNodeIds]);

  // 用于展开节点
  const expandNode = useCallback(
    (item: G6.Node, flag: boolean) => {
      if (!graphRef.current) return;
      const model = item.getModel();
      if (!model.collapsed) return;
      const matrix = graphRef.current.getGroup().getMatrix();

      const zoom = graphRef.current.getZoom();
      const offsetX = matrix[6] / zoom;
      const offsetY = matrix[7] / zoom;

      graphRef.current.updateItem(item, {
        collapsed: !flag,
      });
      graphRef.current.changeData(cloneData);
      circleMap.forEach((k, v) => {
        if (graphRef.current.findById(v) && graphRef.current.findById(k)) {
          graphRef.current.addItem("edge", {
            source: k,
            target: v,
            type: "circle-line",
          });
        }
      });
      //保持在展开折叠后树节点位置不变
      graphRef.current.translate(offsetX, offsetY);
      graphRef.current.zoom(zoom);
      graphRef.current.refresh();
      refreshGitAndImportChangedNodes();
    },
    [graphRef, cloneData, circleMap],
  );

  const expandNodeSequentially = useCallback(
    async (id: string) => {
      const rawItem = graphRef.current.findById(id) as G6.Node;

      // 处理节点展开逻辑
      if (rawItem) {
        //如果图里能找到节点，则展开节点并等待渲染完成
        expandNode(rawItem, true);
        // 等待一帧确保渲染完成
        // await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => setTimeout(resolve, 0));
      } else {
        // 如果找不到节点，则遍历数据查找路径，展开路径节点
        let path: string[] = [];
        G6.Util.traverseTree(cloneData, (node) => {
          if (node.id === id) {
            path = [...node.path];
            return false;
          }
          return true;
        });

        const updatedIds = new Set<string>();
        if (path.length) {
          for (const pid of path) {
            if (!updatedIds.has(pid)) {
              const rawPathItem = graphRef.current.findById(pid) as G6.Node;
              if (rawPathItem) {
                expandNode(rawPathItem, true);
                // 每个路径节点展开后都等待渲染
                // await new Promise((resolve) => requestAnimationFrame(resolve));
                await new Promise((resolve) => setTimeout(resolve, 0));
              }
              updatedIds.add(pid);
            }
          }
        }
      }

      // 额外等待确保高亮效果渲染
      await new Promise((resolve) => requestAnimationFrame(resolve));
    },
    [graphRef.current, expandNode, highlightedNodeIds],
  );

  const highlightNodesSequentially = useCallback(async () => {
    for (const id of highlightedNodeIds) {
      await expandNodeSequentially(id);
    }
    for (const id of highlightedNodeIds) {
      // 处理高亮逻辑
      const item = graphRef.current.findById(id) as G6.Node;
      if (!item) return;

      const relatedEdges = item.getEdges() || [];
      graphRef.current.setItemState(item, State.HIGHLIGHTE, true);
      graphRef.current.refreshItem(item);

      relatedEdges.forEach((edge) => {
        const {
          _cfg: { currentShape },
        } = edge;
        if (currentShape === "custom-polyline") {
          graphRef.current.setItemState(edge, State.HIGHLIGHTE, true);
          graphRef.current.refreshItem(edge);
        } else {
          //判断当前节点是否是起点
          if (edge.getSource().getModel().id === item.getModel().id) {
            graphRef.current.setItemState(edge, State.HIGHLIGHTE, true);
            graphRef.current.refreshItem(edge);
          }
        }
      });
    }
  }, [highlightedNodeIds, graphRef.current, expandNodeSequentially]);

  useEffect(() => {
    if (!staticRoot) return;
    const newData = deepClone(staticRoot);
    const map = new Map();
    //转换为g6的数据格式
    G6.Util.traverseTree(newData, (subTree) => {
      // const subTree:StaticTreeNode = _subTree;
      // if (new Set(subTree.path).size !== subTree.path.length) {
      //   for (let i = 0; i < subTree.idpath.length; i++) {
      //     if (subTree.path[i] === subTree.pathId) {
      //       const id = rootPath + subTree.path[i] + "-" + subTree.idpath[i];

      //       map.set(id, rootPath + subTree.id);
      //     }
      //   }
      // }
      // subTree.id = rootPath + subTree.id;
      //初始化折叠状态
      subTree.collapsed = subTree.paths.length >= 2 ? true : false;
      // for (let i = 0; i < subTree.path.length; i++) {
      //   subTree.path[i] = rootPath + subTree.path[i] + "-" + subTree.idpath[i];
      // }
      return true;
    });
    setCloneData(newData as any);
    setCircleMap(map);
  }, [staticRoot]);

  useEffect(() => {
    if (!cloneData || !containerRef.current) return;
    // hover
    const tooltip = new G6.Tooltip({
      offsetX: 10,
      offsetY: 20,
      getContent(e) {
        const model = e.item._cfg.model;
        const outDiv = document.createElement("div");
        outDiv.style.width = "fit-content";
        outDiv.innerHTML = model.relativeId as string;
        return outDiv;
      },
      itemTypes: ["node"],
    });

    //注册自定节点和边
    G6RegisterNode();

    const width = containerRef.current.scrollWidth;
    const height = containerRef.current.scrollHeight || 500;
    const graph = new G6.TreeGraph({
      container: "container",
      width,
      height,
      // fitView: true,
      modes: {
        default: [
          {
            type: "collapse-expand",
            onChange: function onChange(item, collapsed) {
              const data = item.get("model");
              graph.updateItem(item, {
                collapsed,
              });
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
          "drag-canvas",
          "zoom-canvas",
        ],
      },
      nodeStateStyles: {
        highlight: {
          stroke:
            theme === "dark" ? COLOR.DARK.HIGHLIGHT : COLOR.LIGHT.HIGHLIGHT,
          lineWidth: 2,
        },
        gitChanged: {
          stroke: theme === "dark" ? COLOR.DARK.GIT : COLOR.LIGHT.GIT,
          lineWidth: 2,
        },
        importChanged: {
          stroke: theme === "dark" ? COLOR.DARK.IMPORT : COLOR.LIGHT.IMPORT,
          lineWidth: 2,
        },
      },
      defaultNode: {
        type: "tree-node",
        anchorPoints: [
          [0, 0.5],
          [1, 0.5],
        ],
      },
      defaultEdge: {
        type: "custom-polyline",
      },
      layout: {
        type: "compactBox",
        direction: "LR",
        getId: function getId(d) {
          return d.id;
        },
        getVGap: function getVGap() {
          return 0;
        },
        getHGap: function getHGap() {
          return 80;
        },
      },
      fitViewPadding: [50, 450, 50, 50],
      plugins: [tooltip],
    });

    graphRef.current = graph;

    // initData(staticRoot);

    graph.data(cloneData);
    graph.render();
    circleMap.forEach((k, v) => {
      if (graph.findById(v) && graph.findById(k)) {
        graph.addItem("edge", {
          source: k,
          target: v,
          type: "circle-line",
        });
      }
    });
    // graph.fitView();
    //居中
    graph.translate(graph.getWidth() / 2, graph.getHeight() / 2);

    //注册事件 --> 折叠与展开 高亮节点
    graph.on("node:click", (e) => {
      if (e.target.cfg.name === "collapse-icon") {
        clearHighlight();
        const item = e.item;
        if (!item) return;
        const model = item.getModel();
        const matrix = graph.getGroup().getMatrix();

        const zoom = graph.getZoom();
        const offsetX = matrix[6] / zoom;
        const offsetY = matrix[7] / zoom;

        graph.updateItem(item, {
          collapsed: !model.collapsed,
        });
        graph.changeData(cloneData);
        circleMap.forEach((k, v) => {
          if (graph.findById(v) && graph.findById(k)) {
            graph.addItem("edge", {
              source: k,
              target: v,
              type: "circle-line",
            });
          }
        });
        //保持在展开折叠后树节点位置不变
        graph.translate(offsetX, offsetY);
        graph.zoom(zoom);
        graph.refresh();
        refreshGitAndImportChangedNodes();
      } else {
        e.stopPropagation();
        clearHighlight();
        const item = e.item;
        // const edges = item.getEdges();
        const set = new Set<string>();
        // item.setState("highlight", true);
        // graph.refreshItem(item);
        item._cfg.id && set.add(item._cfg.id);
        // edges.forEach((edge) => {
        //   set.add(edge._cfg.id);
        // });
        setHighlightedNodeIds(set);
      }
    });

    //点击画布取消高亮
    graph.on("canvas:click", () => {
      clearHighlight();
    });
    return () => {
      graph.destroy();
      graphRef.current = null;
    };
  }, [cloneData]);

  useEffect(() => {
    showGitChangedNodesRef.current = showGitChangedNodes;
    handleNodeState(gitChangedNodes, State.GIT, showGitChangedNodes);
    // 如果取消当前节点的git状态，则再次执行import状态，以防止git状态的取消影响到import状态
    if (showImportChangedNodes && !showGitChangedNodes) {
      handleNodeState(importChangedNodes, State.IMPORT, showImportChangedNodes);
    }
  }, [showGitChangedNodes]);

  useEffect(() => {
    showImportChangedNodesRef.current = showImportChangedNodes;
    handleNodeState(importChangedNodes, State.IMPORT, showImportChangedNodes);
    if (showGitChangedNodes && !showImportChangedNodes) {
      handleNodeState(gitChangedNodes, State.GIT, showGitChangedNodes);
    }
  }, [showImportChangedNodes]);

  useEffect(() => {
    gitChangedNodesRef.current = gitChangedNodes;
  }, [gitChangedNodes]);

  useEffect(() => {
    importChangedNodesRef.current = importChangedNodes;
  }, [importChangedNodes]);

  useEffect(() => {
    if (!window) return;
    window.onresize = throttle(() => {
      containerRef.current.style.width = `${document.documentElement.clientWidth}px`;
      containerRef.current.style.height = `${document.documentElement.clientHeight}px`;
      if (graphRef.current) {
        graphRef.current.changeSize(window.innerWidth, window.innerHeight);
        graphRef.current.fitView();
      }
    }, 100);
    return () => {
      window.onresize = null;
    };
  }, []);

  const handleNodeState = (
    nodeIds: Set<string>,
    type: string,
    showNodes: boolean,
  ) => {
    if (!graphRef.current) return;
    clearHighlight();
    if (showNodes) {
      nodeIds.forEach((id) => {
        const node = graphRef.current.findById(id) as G6.Node;
        if (node) {
          clearState(node);
          node.setState(type, true);
          graphRef.current.refreshItem(node);
          const relatedEdges = node.getEdges();
          relatedEdges.forEach((edge) => {
            clearState(edge);
            edge.setState(type, true);
            graphRef.current.refreshItem(edge);
          });
        }
      });
    } else {
      nodeIds.forEach((id) => {
        const node = graphRef.current.findById(id) as G6.Node;
        if (node) {
          clearState(node);
          graphRef.current.refreshItem(node);
          const relatedEdges = node.getEdges();
          relatedEdges.forEach((edge) => {
            clearState(edge);
            graphRef.current.refreshItem(edge);
          });
        }
      });
    }
  };
  const clearHighlight = () => {
    setHighlightedNodeIds(new Set());
  };

  const clearState = (item: G6.Node | G6.IEdge) => {
    Object.values(State).forEach((state) => {
      item.setState(state, false);
      graphRef.current.refreshItem(item);
    });
  };

  const refreshGitAndImportChangedNodes = () => {
    //如果原本git节点显示了，那折叠后恢复
    showGitChangedNodesRef.current &&
      handleNodeState(gitChangedNodesRef.current, State.GIT, true);
    //如果原本import节点显示了，那折叠后恢复
    showImportChangedNodesRef.current &&
      handleNodeState(importChangedNodesRef.current, State.IMPORT, true);
  };

  return (
    <div id="container" ref={containerRef} className="w-100vw h-100vh"></div>
  );
}
