import { SetStateAction, useCallback, useEffect, useState } from "react";
import * as d3 from "d3";
import { SwitchTransition, CSSTransition } from "react-transition-group";
import DrawRect from "./DrawRect";
import { Data, DrawSVGProps } from "./types";
import { Node } from "../../../types/types";
import DrawStore from "./store";
import "./index.scss";
import { useStore } from "../../contexts";
import Loading from "../Loading";
import { throttle } from "@/utils/throttle";
/*
 @return {
    name: string;
    size: number;
    children: [...]
 }
*/
function changeData(data: Node): Data | undefined {
  if (!data) {
    return void 0;
  }
  const dep = data.dependencies;
  const newdata: Data = { name: "", children: [] };
  const depvalues = Object.values(dep || {});
  // console.log("depvalues", depvalues);

  if (depvalues.length !== 0) {
    depvalues.forEach((item) => {
      const children = changeData(item);
      if (children) {
        (newdata.children as Data[])?.push(children);
      }
    });
  }
  // for (const i in dep) {
  //   // console.log("1", i)
  //   isEmpty = false
  //   const children = changeData(dep[i] as JSONData)
  //   if (children) {
  //     newdata.children.push(children)
  //   }
  // }

  newdata.name = `${data.name}@${data.version}`;
  newdata.size = data.size ? data.size : 0;
  return newdata;
}

const FirstTreeMap = ({
  // jsonData,
  hiddenWidthMultiplier = 10,
  hiddenHeightMultiplier = 10,
  width = 500,
  height = 500,
  margin = 0,
  padding = 2,
  RectFontSize = 14,
  fullScreen = false,
  loading = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Loading />
    </div>
  ),
}: DrawSVGProps) => {
  if (fullScreen) {
    width = window.innerWidth;
    height = window.innerHeight;
  }

  const [state, setState] = useState<number>(0); // control transition
  const [data, setData] = useState<Data>();
  const [treeMap, setTreeMap] = useState<d3.HierarchyRectangularNode<Data>>();
  const { selectedNode, setSelectNode } = useStore((store) => {
    return {
      selectedNode: store.selectedNode,
      setSelectNode: store.setSelectNode,
    };
  });
  const [innerWidth, setInnerWidth] = useState(width);
  const [innerHeight, setInnerHeight] = useState(height);
  if (!selectedNode && treeMap) setTreeMap(void 0);
  // init
  useEffect(() => {
    setData(changeData(selectedNode));
  }, [selectedNode]);

  const updateTreeMap = useCallback(
    (data: Data) => {
      if (!data) return;

      const dataTree = {
        name: data.name,
        _size: data.size,
        size: data.children.length ? void 0 : data.size || data._size,
        children: (data.children as Data[]).map((item) => {
          return {
            name: item.name,
            size: item.size,
            _children: item.children,
            children: [],
          };
        }),
      };
      // console.log(dataTree)
      const rootTree = d3
        .hierarchy(dataTree)
        .sum((d) => {
          return d.size ? d.size : 0;
        }) // 计算绘图属性value的值  -求和 其子节点所有.size属性的和值
        .sort((a, b) => {
          return (b.value as number) - (a.value as number);
        }); // 根据 上面计算出的 value属性 排序

      const TreeMap = fullScreen
        ? d3
            .treemap()
            .size([width - 2 * margin, height - 2 * margin])
            .round(true)
            .paddingTop(20)
            .paddingLeft(10)
            .paddingRight(10)
            .paddingInner(padding)(rootTree as d3.HierarchyNode<Data>)
        : d3
            .treemap()
            .size([width - 2 * margin, height - 2 * margin])
            .round(true)
            .paddingInner(padding)(rootTree as d3.HierarchyNode<Data>);
      if (width < 500 || height < 500) {
        // 省略较小的依赖
        const hideRoot = [];
        // console.log("TreeMap.children", TreeMap, TreeMap.children);
        if (TreeMap.children)
          TreeMap.children.forEach((child) => {
            const { x1, x0, y1, y0, data } = child;
            // console.log(child);
            // console.log(hideRoot);
            const width = x1 - x0;
            const height = y1 - y0;
            const rootWidth = TreeMap.x1 - TreeMap.x0;
            const rootHeight = TreeMap.y1 - TreeMap.y0;

            if (
              width < rootWidth / hiddenWidthMultiplier ||
              height < rootHeight / hiddenHeightMultiplier
            ) {
              hideRoot.push((data as Data).name);
            }
          });
        // console.log(hideRoot, data);
        if (hideRoot.length > 0) {
          const newData = {
            name: data.name,
            size: data.size,
            children:
              (data.children as Data[]).filter((item) => {
                return !hideRoot.includes(item.name);
              }) || [],
          };
          // console.log(newData);

          updateTreeMap(newData);
          return;
        }
      }

      setTreeMap(
        TreeMap as SetStateAction<
          d3.HierarchyRectangularNode<Data> | undefined
        >,
      );
      // console.log(data, rootTree, TreeMap);
    },
    [height, margin, width],
  );

  // data change options
  useEffect(() => {
    if (data) updateTreeMap(data);
  }, [data, updateTreeMap]);

  const handle_rect_click = (data: Data) => {
    /*data:{name,size,children,_children} */
    return () => {
      // console.log(data);

      if (!data._children || !data._children.length) return;
      setState(state ? 0 : 1);
      data.children = data._children;
      setSelectNode(
        selectedNode.dependencies[
          data.name.split("@")[0]
            ? data.name.split("@")[0]
            : `@${data.name.split("@")[1]}`
        ],
      );
      updateTreeMap(data);
    };
  };

  useEffect(() => {
    // 监听窗口大小变化
    window.addEventListener(
      "resize",
      throttle(() => {
        setInnerWidth(window.innerWidth);
        setInnerHeight(window.innerHeight);
      }),
      false,
    );
  }, []);

  return (
    <DrawStore value={{ handle_rect_click, loading, RectFontSize }}>
      <div
        // className={`relative w-[${width}px] h-[${height}px] bg-[#1a3055ff]`}
        style={{
          position: "relative",
          width: innerWidth,
          height: innerHeight,
          backgroundColor: "var(--color-border)",
        }}
        className="text-dark-500"
      >
        <SwitchTransition mode="out-in">
          <CSSTransition classNames={"fade"} key={state} timeout={500}>
            <div
              style={{
                position: "absolute",
                left: margin,
                top: margin,
                width: "100%",
                height: "100%",
                textAlign: "center",
              }}
            >
              {treeMap && (
                <DrawRect isHierarchy={fullScreen} treeMap={treeMap}></DrawRect>
              )}
              {!treeMap && loading}
            </div>
          </CSSTransition>
        </SwitchTransition>
      </div>
    </DrawStore>
  );
};

export default FirstTreeMap;
