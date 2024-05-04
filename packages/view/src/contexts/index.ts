import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";
import { subscribeWithSelector } from "zustand/middleware";
import type { Node, Store } from "../../types/types";
import { linkContext } from "./linkContext";
import { searchNode, searchNodePath } from "./searchNode";
import { generateGraph } from "@dep-spy/core";
import { combineRes } from "./combineRes";

export const useStore = createWithEqualityFn<Store>()(
  subscribeWithSelector((set) => ({
    theme: localStorage.getItem("theme") || "dark",
    language: localStorage.getItem("language") || "en",
    info: "",
    sizeTree: false,
    sizeLoading: true,
    rootLoading: true,
    root: null,
    sizeRoot: null,
    depth: 3,
    collapse: true,
    codependency: {},
    circularDependency: [],
    selectedNode: null, // 默认选中根节点
    selectedSizeNode: null,
    selectedCodependency: [],
    selectedCircularDependency: null,
    selectedNodeHistory: [],
    setRoot: (root: Node) => set({ root }),
    setSizeRoot: (sizeRoot: Node) => set({ sizeRoot }),
    setDepth: (depth: number) => set({ depth }),
    setInfo: (info: string) => set({ info }),
    setSizeTree: (sizeTree: boolean) => set({ sizeTree }),
    setSizeLoading: (sizeLoading: boolean) => set({ sizeLoading }),
    setRootLoading: (rootLoading: boolean) => set({ rootLoading }),
    setSelectNode: (selectedNode: Node) => {
      const { setSelectNodeHistory } = useStore.getState();
      setSelectNodeHistory(selectedNode);
      set({ selectedNode });
      const tempNode = searchNodePath(
        useStore.getState().sizeRoot,
        selectedNode.path,
      );
      set({ selectedSizeNode: tempNode });
    },
    setSelectSizeNode: (selectedSizeNode: Node) => {
      set({ selectedSizeNode });

      const { setSelectNodeHistory } = useStore.getState();
      delete selectedSizeNode.size;
      set({ selectedNode: selectedSizeNode });
      setSelectNodeHistory(selectedSizeNode);
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
        const tempNode = searchNodePath(
          useStore.getState().sizeRoot,
          preNode.path,
        );
        set({
          selectedNode: preNode,
          selectedSizeNode: tempNode,
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
if (import.meta.env.VITE_BUILD_MODE != "online") {
  linkContext(useStore);
}
