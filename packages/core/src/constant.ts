export interface Node {
  name: string;
  version: string;
  description?: string;
  cache?: string;
  circlePath?: string;
  dependencies: Record<string, Node>;
}
export interface Config {
  depth?: number;
  outDir?: string;
  online?: boolean;
}
