export interface Node {
  name: string;
  version: string;
  description?: string;
  cache?: string;
  circlePath?: string[];
  devDependencies: Record<string, Node>;
  size?: number;
}
export interface Config {
  depth?: number;
  outDir?: string;
  online?: boolean;
  actual?: boolean;
}
