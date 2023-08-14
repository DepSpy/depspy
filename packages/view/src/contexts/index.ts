import { create } from "zustand";
import { graph } from "virtual:graph-data";
import { Node } from "../../types/types";

interface Store {
  root: Node;
  codependency: Node[];
  circularDependency: Node[];
  selectedNode: Node;
  setRoot: (root: Node) => void;
  setSelectNode: (selectedNode: Node) => void;
}

const { root, codependency, circularDependency } = graph;

export const useStore = create<Store>((set) => ({
  root,
  codependency,
  circularDependency,
  selectedNode: root, // 默认选中根节点
  setRoot: (root: Node) => set({ root }),
  setSelectNode: (selectedNode: Node) => set({ selectedNode }),
}));
