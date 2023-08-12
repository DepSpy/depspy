import { SetStateAction, useCallback, useEffect, useState } from "react";
import * as d3 from "d3";
import { SwitchTransition, CSSTransition } from "react-transition-group";
import DrawRect from "./DrawRect";
import { Data, DrawSVGProps } from "./types";
import { Node } from "../../../types/types";
import DrawStore from "./store";
import React from "react";
import "./index.css";
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
  const newdata: Data = { name: "" };
  newdata.children = [];
  let isEmpty = true;
  const depvalues = Object.values(dep);
  if (depvalues.length !== 0) {
    isEmpty = false;
    depvalues.forEach((item) => {
      const children = changeData(item);
      if (children) {
        newdata.children?.push(children);
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
  if (isEmpty) {
    return newdata;
  }
  return newdata;
}

const FirstTreeMap = ({
  jsonData,
  width = 500,
  height = 500,
  margin = 10,
}: DrawSVGProps) => {
  const [state, setState] = useState<number>(0); // control transition
  const [data, setData] = useState<Data>();
  const [treeMap, setTreeMap] = useState<d3.HierarchyRectangularNode<Data>>();
  // init
  useEffect(() => {
    setData(changeData(jsonData));
  }, [jsonData]);
  const updateTreeMap = useCallback(
    (data: Data) => {
      if (!data) return;
      const dataTree = {
        name: data.name,
        _size: data.size,
        size: data.children
          ? data.children.length
            ? void 0
            : data.size || data._size
          : data.size || data._size,
        children: data.children
          ? data.children.map((item) => {
              return {
                name: item.name,
                size: item.size,
                _children: item.children,
                children: [],
              };
            })
          : [],
      };
      // console.log(dataTree)
      const rootTree = d3
        .hierarchy(dataTree)
        .sum((d) => {
          return d.size ? d.size : 0;
        }) // 计算绘图属性value的值  -求和 其子节点所有.size属性的和值
        .sort((a, b) => {
          return (a.value as number) - (b.value as number);
        }); // 根据 上面计算出的 value属性 排序

      const TreeMap = d3
        .treemap()
        .size([width - 2 * margin, height - 2 * margin])
        .round(true)
        .padding(10)(rootTree as d3.HierarchyNode<unknown>);
      setTreeMap(
        TreeMap as SetStateAction<
          d3.HierarchyRectangularNode<Data> | undefined
        >,
      );
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
      if (!data._children || !data._children.length) return;
      setState(state ? 0 : 1);
      data.children = data._children;

      updateTreeMap(data);
    };
  };

  return (
    <DrawStore value={handle_rect_click}>
      <div
        style={{
          position: "relative",
          width: width,
          height: height,
          backgroundColor: "#1a3055",
        }}
      >
        <SwitchTransition mode="out-in">
          <CSSTransition classNames={"fade"} key={state} timeout={500}>
            <div style={{ position: "absolute", left: margin, top: margin }}>
              {treeMap && <DrawRect treeMap={treeMap}></DrawRect>}
            </div>
          </CSSTransition>
        </SwitchTransition>
      </div>
    </DrawStore>
  );
};

export default FirstTreeMap;
