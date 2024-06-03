import { StaticNode } from "@dep-spy/core";

export interface Node {
  name: string;
  version: string;
  declarationVersion: string;
  childrenNumber: number | "0";
  path?: string[];
  description?: string;
  cache?: string;
  circlePath?: string[];
  dependencies: Record<string, Node>;
  size?: number;
}

export interface generateGraphRes {
  root?: Node;
  codependency?: Record<string, Node[]>;
  circularDependency?: Node[];
  depth: number;
}

export interface Store {
  theme: string;
  language: string;
  root: Node;
  sizeRoot: Node;
  sizeTree: boolean;
  info: string;
  sizeLoading: boolean;
  rootLoading: boolean;
  depth: number;
  collapse: boolean;
  codependency: Record<string, Node[]>;
  circularDependency: Node[];
  selectedNode: Node;
  selectedSizeNode: Node;
  selectedCodependency: Node[] | [];
  selectedCircularDependency: Node | null;
  selectedNodeHistory: Node[];
  setRoot: (root: Node) => void;
  setSizeRoot: (sizeRoot: Node) => void;
  setInfo: (info: string) => void;
  setDepth: (depth: number) => void;
  setSizeTree: (sizeTree: boolean) => void;
  setSizeLoading: (sizeLoading: boolean) => void;
  setRootLoading: (rootLoading: boolean) => void;
  setSelectNode: (selectedNode: Node) => void;
  setSelectSizeNode: (selectedSizeNode: Node) => void;
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

export interface StaticStore {
  staticRoot: StaticNode;
  staticRootLoading: boolean;
  setStaticRoot: (staticRoot: StaticNode) => void;
  setStaticRootLoading: (staticRootLoading: boolean) => void;
}
