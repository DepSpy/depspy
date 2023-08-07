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

export interface generateGraphRes {
  root?: Node;
  codependency?: Node[];
  circularDependency?: Node[];
}
