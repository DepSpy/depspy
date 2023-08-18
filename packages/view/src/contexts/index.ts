import { create } from "zustand";
import { graph } from "virtual:graph-data";
import { Node } from "../../types/types";

interface Store {
  root: Node;
  codependency: Node[];
  circularDependency: Node[];
  selectedNode: Node;
  selectedCodependency: Node | null;
  selectedCircularDependency: Node | null;
  setRoot: (root: Node) => void;
  setSelectNode: (selectedNode: Node) => void;
  setSelectCodependency: (selectedCodependency: Node) => void;
  setSelectCircularDependency: (selectedCircularDependency: Node) => void;
}

const { root, codependency, circleDependency } = graph;

export const useStore = create<Store>((set) => ({
  root,
  codependency,
  circularDependency: circleDependency,
  selectedNode: root, // 默认选中根节点
  selectedCodependency: null,
  selectedCircularDependency: null,
  setRoot: (root: Node) => set({ root }),
  setSelectNode: (selectedNode: Node) => set({ selectedNode }),
  setSelectCodependency: (selectedCodependency: Node) =>
    set({ selectedCodependency }),
  setSelectCircularDependency: (selectedCircularDependency: Node) =>
    set({ selectedCircularDependency }),
}));
