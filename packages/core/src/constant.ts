export interface Node {
  name: string;
  version: string;
  declarationVersion: string;
  description?: string;
  cache?: string;
  circlePath?: string[];
  dependencies: Record<string, Node>;
  size?: number;
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
