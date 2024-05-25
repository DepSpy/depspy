import { useEffect } from "react";
import G6 from "@antv/g6";
import { useStaticStore } from "@/contexts";
import { textOverflow } from "../../utils/textOverflow";
export default function StaticTree() {
  const { staticRoot } = useStaticStore();
  useEffect(() => {
    if (!staticRoot) return;
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
              stroke: "rgb(167,167,167)",
              radius: 5,
            },
            // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
            name: "rect-shape",
          });
          const content = textOverflow(cfg.path, 100);
          const text = group.addShape("text", {
            attrs: {
              text: content,
              fill: "white",
            },
            // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
            name: "text-shape",
          });
          const tbox = text.getBBox();
          const rbox = rect.getBBox();
          const hasChildren = cfg.children && cfg.children.length > 0;
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
                stroke: "rgb(167,167,167)",
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
          icon.attr(
            "symbol",
            cfg.collapsed ? G6.Marker.expand : G6.Marker.collapse,
          );
        },
      },
      "single-node",
    );
    G6.registerEdge("custom-polyline", {
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
    });
    const container = document.getElementById("container");
    const width = container.scrollWidth;
    const height = container.scrollHeight || 500;
    const graph = new G6.TreeGraph({
      container: "container",
      width,
      height,
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
    });
    //转换为g6的数据格式
    G6.Util.traverseTree(staticRoot, (subTree) => {
      subTree.children = Object.values(subTree.dependencies || {});
      return true;
    });
    graph.data(staticRoot);
    graph.render();
    graph.fitView();

    if (typeof window !== "undefined")
      window.onresize = () => {
        if (!graph || graph.get("destroyed")) return;
        if (!container || !container.scrollWidth || !container.scrollHeight)
          return;
        graph.changeSize(container.scrollWidth, container.scrollHeight);
      };
  }, [staticRoot]);

  return <div id="container" className="w-100vw h-100vh"></div>;
}
