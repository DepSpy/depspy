import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";
import { subscribeWithSelector } from "zustand/middleware";
import type { Node } from "../../types/types";
import { linkContext } from "./linkContext";
import { searchNode } from "./searchNode";
import { generateGraph } from "@dep-spy/core";
import { combineRes } from "./combineRes";

export const useStore = createWithEqualityFn<Store>()(
  subscribeWithSelector((set) => ({
    theme: "light",
    info: "",
    root: null,
    depth: 3,
    collapse: true,
    codependency: {},
    circularDependency: [],
    selectedNode: null, // 默认选中根节点
    selectedCodependency: [],
    selectedCircularDependency: null,
    setRoot: (root: Node) => set({ root }),
    setDepth: (depth: number) => set({ depth }),
    setInfo: (info: string) => set({ info }),
    setSelectNode: (selectedNode: Node) => set({ selectedNode }),
    setSelectCodependency: (selectedCodependency: Node[]) =>
      set({ selectedCodependency }),
    setSelectCircularDependency: (selectedCircularDependency: Node) =>
      set({ selectedCircularDependency }),
    searchNode,
    setCollapse: (collapse) => set({ collapse }),
    setTheme: (theme: string) => {
      set({ theme: theme === "light" ? "dark" : "light" });
    },
    setGraphRes: async (info, depth) => {
      const graph = generateGraph(info, { depth });
      const res = await combineRes(graph, depth);
      set(res);
    },
  })),
  shallow,
);
if (import.meta.env.VITE_BUILD_MODE == "offline") {
  linkContext(
    ({ root, circularDependency, codependency, depth }, ws) => {
      //连接初始化回调
      useStore.setState({
        root,
        circularDependency,
        codependency,
        selectedNode: root,
        depth,
      });
      useStore.subscribe(
        (state) => state.depth,
        (newDepth) => {
          ws.send(newDepth + "");
        },
      );
    },
    ({ root, circularDependency, codependency }) => {
      //更新回调
      useStore.setState({
        root,
        circularDependency,
        codependency,
        selectedNode: root,
      });
    },
  );
}

export interface Store {
  theme: string;
  root: Node;
  info: string;
  depth: number;
  collapse: boolean;
  codependency: Record<string, Node[]>;
  circularDependency: Node[];
  selectedNode: Node;
  selectedCodependency: Node[] | [];
  selectedCircularDependency: Node | null;
  setRoot: (root: Node) => void;
  setInfo: (info: string) => void;
  setDepth: (depth: number) => void;
  setSelectNode: (selectedNode: Node) => void;
  setSelectCodependency: (selectedCodependency: Node[]) => void;
  setSelectCircularDependency: (selectedCircularDependency: Node) => void;
  searchNode: (root: Node, target: string) => Node[];
  setCollapse: (flag: boolean) => void;
  setTheme: (theme: string) => void;
  setGraphRes: (name: string, depth: number) => void;
}
