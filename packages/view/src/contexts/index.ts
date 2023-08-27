import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";
import { subscribeWithSelector } from "zustand/middleware";
import type { Node } from "../../types/types";
import { linkContext } from "./linkContext";
import { searchNode, searchNodePath } from "./searchNode";
import { generateGraph } from "@dep-spy/core";
import { combineRes } from "./combineRes";

export const useStore = createWithEqualityFn<Store>()(
  subscribeWithSelector((set) => ({
    theme: localStorage.getItem("theme") || "dark",
    language: localStorage.getItem("language") || "en",
    info: "",
    root: null,
    depth: 3,
    collapse: true,
    codependency: {},
    circularDependency: [],
    selectedNode: null, // 默认选中根节点
    selectedCodependency: [],
    selectedCircularDependency: null,
    selectedNodeHistory: [],
    setRoot: (root: Node) => set({ root }),
    setDepth: (depth: number) => set({ depth }),
    setInfo: (info: string) => set({ info }),
    setSelectNode: (selectedNode: Node) => {
      const { setSelectNodeHistory } = useStore.getState();
      setSelectNodeHistory(selectedNode);
      set({ selectedNode });
    },
    setSelectCodependency: (selectedCodependency: Node[]) =>
      set({ selectedCodependency }),
    setSelectCircularDependency: (selectedCircularDependency: Node) =>
      set({ selectedCircularDependency }),
    searchNode,
    setCollapse: (collapse) => set({ collapse }),
    setTheme: (theme: string) => {
      localStorage.setItem("theme", theme === "light" ? "dark" : "light");
      set({ theme: theme === "light" ? "dark" : "light" });
    },
    setLanguage: (language: string) => {
      localStorage.setItem("language", language);
      set({ language });
    },
    setGraphRes: async (info, depth) => {
      const graph = generateGraph(info, { depth });
      const res = await combineRes(graph, depth);
      set(res);
    },
    setSelectNodeHistory: (node) => {
      const { selectedNodeHistory } = useStore.getState();
      // 当前节点不在历史记录的最后一个，且历史记录长度大于10时，删除最早的一条记录
      if (selectedNodeHistory[selectedNodeHistory.length - 1] !== node) {
        if (selectedNodeHistory.length < 10) {
          set({
            selectedNodeHistory: [...selectedNodeHistory, node],
          });
        } else if (selectedNodeHistory.length >= 10) {
          set({
            selectedNodeHistory: [...selectedNodeHistory.slice(1), node],
          });
        }
      }
    },
    setPreSelectNode: () => {
      const { selectedNodeHistory } = useStore.getState();
      if (selectedNodeHistory.length > 1) {
        const preNode = selectedNodeHistory[selectedNodeHistory.length - 2];
        set({
          selectedNode: preNode,
          selectedNodeHistory: selectedNodeHistory.slice(
            0,
            selectedNodeHistory.length - 1,
          ),
        });
      }
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
        selectedNodeHistory: [root],
      });
      useStore.subscribe(
        (state) => state.depth,
        (newDepth) => {
          ws.send(JSON.stringify({ type: "depth", newDepth }));
        },
      );
      ws.send(JSON.stringify({ type: "size", newDepth: depth }));
    },
    ({ root, circularDependency, codependency }, ws) => {
      // 更新depth回调
      // 找到新 tree 中的 selectedNode
      const { selectedNode } = useStore.getState();
      const tempNode = searchNodePath(root, selectedNode.path);
      useStore.setState({
        root,
        circularDependency,
        codependency,
        selectedNode: tempNode,
      });
      // 更新完 depth 后，需要重新获取 size
      const { depth } = useStore.getState();
      ws.send(JSON.stringify({ type: "size", newDepth: depth }));
    },
    ({ root, circularDependency, codependency }) => {
      // 更新size回调
      const { selectedNode } = useStore.getState();
      const tempNode = searchNodePath(root, selectedNode.path);
      useStore.setState({
        root,
        selectedNode: tempNode,
        circularDependency,
        codependency,
      });
    },
  );
}

export interface Store {
  theme: string;
  language: string;
  root: Node;
  info: string;
  depth: number;
  collapse: boolean;
  codependency: Record<string, Node[]>;
  circularDependency: Node[];
  selectedNode: Node;
  selectedCodependency: Node[] | [];
  selectedCircularDependency: Node | null;
  selectedNodeHistory: Node[];
  setRoot: (root: Node) => void;
  setInfo: (info: string) => void;
  setDepth: (depth: number) => void;
  setSelectNode: (selectedNode: Node) => void;
  setSelectCodependency: (selectedCodependency: Node[]) => void;
  setSelectCircularDependency: (selectedCircularDependency: Node) => void;
  searchNode: (root: Node, target: string) => Node[];
  setCollapse: (flag: boolean) => void;
  setTheme: (theme: string) => void;
  setLanguage: (language: string) => void;
  setGraphRes: (name: string, depth: number) => Promise<void>;
  setSelectNodeHistory: (node: Node) => void;
  setPreSelectNode: () => void;
}
