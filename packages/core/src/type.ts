import { EventBus } from "./pool/worker";
import { Worker } from "./pool/pool";

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
export type Event = {
  [K in keyof typeof EventBus]: {
    Task: {
      type: K;
      params: Parameters<(typeof EventBus)[K]>[0];
    };
    Result: Awaited<ReturnType<(typeof EventBus)[K]>>;
  };
};

export type Resolve<T extends keyof Event> = (result: {
  data: Event[T]["Result"];
  worker: Worker;
  error: Error;
}) => unknown;
