import { create } from "zustand";
import { graph } from "virtual:graph-data";
import { Node } from "../../types/types";

interface Store {
  theme: string;
  root: Node;
  codependency: Record<string, Node[]>;
  circularDependency: Node[];
  selectedNode: Node;
  selectedCodependency: Node[] | [];
  selectedCircularDependency: Node | null;
  setRoot: (root: Node) => void;
  setSelectNode: (selectedNode: Node) => void;
  setSelectCodependency: (selectedCodependency: Node[]) => void;
  setSelectCircularDependency: (selectedCircularDependency: Node) => void;
  searchNode: (root: Node, target: string) => Node[];
  setTheme: (theme: string) => void;
}

const { root, codependency, circularDependency } = graph;

const searchNode = (root: Node, target: string) => {
  const queue = [root];
  const res = [];
  while (queue.length > 0) {
    const currentNode = queue.shift();
    if (currentNode.name.includes(target)) {
      res.push(currentNode);
    }
    const deps = Object.entries(currentNode.dependencies).map((v) => v[1]);
    queue.push(...deps);
  }

  if (res.length <= 10) return res;
  else {
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [res[i], res[j]] = [res[j], res[i]]; // Swap elements
    }
    return res.slice(0, 10);
  }
};

export const useStore = create<Store>((set) => ({
  theme: "light",
  root,
  codependency,
  circularDependency: circularDependency,
  selectedNode: root, // 默认选中根节点
  selectedCodependency: [],
  selectedCircularDependency: null,
  setRoot: (root: Node) => set({ root }),
  setSelectNode: (selectedNode: Node) => set({ selectedNode }),
  setSelectCodependency: (selectedCodependency: Node[]) =>
    set({ selectedCodependency }),
  setSelectCircularDependency: (selectedCircularDependency: Node) =>
    set({ selectedCircularDependency }),
  searchNode,
  setTheme: (theme: string) => {
    set({ theme: theme === "light" ? "dark" : "light" });
  },
}));
