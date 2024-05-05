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
export interface StaticNode {
  path: string;
  resolvedPath: string;
  imports: string[];
  exports: string[];
  dependencies: Record<string, StaticNode>;
}
export interface Config {
  depth?: number;
  size?: boolean;
  entry?: string;
  output?: {
    graph?: string;
    circularDependency?: string;
    codependency?: string;
  };
}
