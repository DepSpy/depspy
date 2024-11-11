import { StaticNode } from "@dep-spy/core";

export interface Node {
  name: string;
  version: string;
  declarationVersion: string;
  childrenNumber: number;
  path?: string[];
  description?: string;
  cache?: string;
  circlePath?: string[];
  dependencies: Record<string, Node>;
  size: number;
  selfSize: number;
  realNamePath: string[];
  resolvePath: string;
  dependenciesList: Record<string, string>;
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
  sizeTree: boolean;
  info: string;
  rootLoading: boolean;
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
  setSizeTree: (sizeTree: boolean) => void;
  setRootLoading: (rootLoading: boolean) => void;
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

export interface StaticStore {
  staticRoot: StaticNode;
  staticRootLoading: boolean;
  setStaticRoot: (staticRoot: StaticNode) => void;
  setStaticRootLoading: (staticRootLoading: boolean) => void;
}
