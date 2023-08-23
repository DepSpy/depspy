import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";
import { subscribeWithSelector } from "zustand/middleware";
import type { Node } from "../../types/types";
import { linkContext } from "./linkContext";
import { searchNode } from "./searchNode";

export const useStore = createWithEqualityFn<Store>()(
  subscribeWithSelector((set) => ({
    theme: "light",
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
  })),
  shallow,
);
if (import.meta.env.VITE_BUILD_MODE == "offline") {
  linkContext(
    ({ root, circularDependency, codependency, depth }, ws) => {
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
  depth: number;
  collapse: boolean;
  codependency: Record<string, Node[]>;
  circularDependency: Node[];
  selectedNode: Node;
  selectedCodependency: Node[] | [];
  selectedCircularDependency: Node | null;
  setRoot: (root: Node) => void;
  setDepth: (depth: number) => void;
  setSelectNode: (selectedNode: Node) => void;
  setSelectCodependency: (selectedCodependency: Node[]) => void;
  setSelectCircularDependency: (selectedCircularDependency: Node) => void;
  searchNode: (root: Node, target: string) => Node[];
  setCollapse: (flag: boolean) => void;
  setTheme: (theme: string) => void;
}
