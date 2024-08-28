import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";
import { subscribeWithSelector } from "zustand/middleware";
import type { Node, StaticStore, Store } from "~/types";
import { linkContext } from "./linkContext";
import { searchNode } from "./searchNode";
import { generateGraph, StaticNode } from "@dep-spy/core";
import { EventBus } from "@/contexts/eventBus.ts";

let graph = null;

export const useStore = createWithEqualityFn<Store>()(
  subscribeWithSelector((set) => ({
    theme: localStorage.getItem("theme") || "dark",
    language: localStorage.getItem("language") || "en",
    info: "",
    sizeTree: false,
    rootLoading: true,
    root: null,
    depth: 3,
    collapse: true,
    codependency: {},
    circularDependency: [],
    selectedNode: null, // 默认选中根节点
    selectedCodependency: [],
    selectedCircularDependency: null,
    selectedNodeHistory: [],
    setRoot: (root: Node & {
      unfold?: boolean;
    }) => set({ root }),
    setDepth: (depth: number) => set({ depth }),
    setInfo: (info: string) => set({ info }),
    setSizeTree: (sizeTree: boolean) => set({ sizeTree }),
    setRootLoading: (rootLoading: boolean) => set({ rootLoading }),
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
      if (!graph) {
        graph = generateGraph(info, { depth });
        await graph.ensureGraph();
        EventBus["init"]({
          ...(await generateBusParams()),
          depth: depth,
        });
      } else {
        await graph.update(depth);
        EventBus["depth"]({
          ...(await generateBusParams()),
        });
      }
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
export const useStaticStore = createWithEqualityFn<StaticStore>()(
  subscribeWithSelector((set) => ({
    staticRootLoading: true,
    staticRoot: null,
    setStaticRoot: (staticRoot: StaticNode) => set({ staticRoot }),
    setStaticRootLoading: (staticRootLoading: boolean) =>
      set({ staticRootLoading }),
  })),
  shallow,
);
if (import.meta.env.VITE_BUILD_MODE != "online") {
  linkContext(useStore);
}

export async function generateBusParams() {
  return {
    root: { ...(await graph.getGraph()) },
    circularDependency: await graph.getCircularDependency(),
    codependency: await graph.getCodependency(),
  };
}
