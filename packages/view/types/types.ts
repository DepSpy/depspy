import { StaticGraphNode as _StaticGraphNode } from "@dep-spy/core";

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
  parent: Node | null;
  unfold?: boolean;
}

export interface StaticNode {
  id: string;
  name: string;
  children: StaticNode[];
  parentId: string;
  pathId: string;
  depth: number;
  idpath: string[];
  path: string[];
  rootId?: string;
  removedExports: string[];
  renderedExports: string[];
  isGitChange: boolean;
  isImportChange: boolean;
  isSideEffectChange: boolean;
  exportEffectedNamesToReasons: {
    [key: string]: {
      isNativeCodeChange?: boolean;
      importEffectedNames: {
        [key: string]: string[];
      };
    };
  };
  importEffectedNames: {
    [key: string]: string[];
  };
}
// 前端使用的图结构
export interface StaticGraphNode extends _StaticGraphNode{
  importers: Set<string>;
  dynamicImporters:Set<string>;
}

// 用于前端视图渲染的结构
export interface StaticTreeNode extends StaticGraphNode{
  // 路径 + 出现次数
  id:string;
  // 子节点
  children: StaticTreeNode[];
  // 从根节点到当前节点的路径数组
  paths:string[];
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
  setSelectNodeHistory: (node: Node) => void;
  setPreSelectNode: () => void;
}

export interface StaticStore {
  staticRoot: StaticTreeNode;
  staticGraph:Map<string, StaticGraphNode>;
  staticRootLoading: boolean;
  highlightedNodeIds: Set<string>;
  gitChangedNodes: Set<string>;
  importChangedNodes: Set<string>;
  showGitChangedNodes: boolean;
  showImportChangedNodes: boolean;
  setShowGitChangedNodes: (flag: boolean) => void;
  setShowImportChangedNodes: (flag: boolean) => void;
  setGitChangedNodes: (nodeIds: Set<string>) => void;
  setImportChangedNodes: (nodeIds: Set<string>) => void;
  setHighlightedNodeIds: (nodeIds: Set<string>) => void;
  setStaticRoot: (staticRoot: StaticTreeNode) => void;
  setStaticGraph: (staticRoot: Map<string, StaticGraphNode>) => void;
  setStaticRootLoading: (staticRootLoading: boolean) => void;
}
