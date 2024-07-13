import { Worker } from "./pool";

export interface Node {
  name: string;
  version: string;
  declarationVersion: string;
  path: string[];
  childrenNumber: number;
  resolvePath: string;
  description?: string;
  cache?: string;
  circlePath?: string[];
  dependencies: Record<string, Node>;
  dependenciesList: Record<string, string>;
  size?: number;
  selfSize: number;
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
    staticGraph?: string;
    circularDependency?: string;
    codependency?: string;
  };
}
export type Resolve<POOL_TASK extends unknown[], RESULT_TYPE> = (result: {
  data: RESULT_TYPE;
  worker: Worker<POOL_TASK, RESULT_TYPE>;
  error: Error;
}) => void;

export type Task<POOL_TASK extends unknown[], RESULT_TYPE> = {
  task: POOL_TASK;
  resolve: Resolve<POOL_TASK, RESULT_TYPE>;
};
