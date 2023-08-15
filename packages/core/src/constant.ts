export interface Node {
  name: string;
  version: string;
  declarationVersion: string;
  path: string[];
  description?: string;
  cache?: string;
  circlePath?: string[];
  dependencies: Record<string, Node>;
  size?: number;
  cacheParentPath?: string[];
}
export interface Config {
  depth?: number;
  output?: {
    graph?: string;
    circularDependency?: string;
    codependency?: string;
  };
  size?: boolean;
  online?: boolean;
}

export const defaultConfig = {
  depth: 3,
  size: false,
  output: {
    graph: "ds.graph.json",
    circularDependency: "ds.circular.json",
    codependency: "ds.co.json",
  },
  online: typeof window !== "undefined" ? true : false,
};
