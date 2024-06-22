import { Worker } from "./pool";

export enum INFO_TYPES {
  GITHUB,
  NPM,
  JSON,
  ROOT,
}
export type MODULE_INFO_TYPE = {
  name: string;
  version: string;
  size: number;
  resolvePath: string;
  description?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};
export type PACKAGE_TYPE = MODULE_INFO_TYPE & Record<string, unknown>;

export enum PATH_TYPE {
  RESOLVE,
  RELATIVE,
  BARE,
  ALIAS,
  UNKNOWN,
}

export interface CODE_INFO {
  imports: string[];
  exports: string[];
}

export interface FILE_INFO extends CODE_INFO {
  resolvePath: string;
  path: string;
  baseDir: string;
}

export interface FILE_CONFIG {
  baseDir: string;
  alias?: ALIAS_CONFIG;
}

export interface TS_CONFIG {
  compilerOptions?: {
    paths?: ALIAS_CONFIG;
  };
}

export type ALIAS_CONFIG = Record<string, string | string[]>;

export type Task<POOL_TASK, RESULT_TYPE> = {
  task: POOL_TASK;
  resolve: (result: RESULT_TYPE) => void;
};

export type Resolve<RESULT_TYPE> = (result: RESULT_TYPE) => void;

export type createWorker<POOL_TASK extends unknown[], RESULT_TYPE> = (
  freeWorkers: Worker<POOL_TASK, RESULT_TYPE>[],
  taskQueue: Task<POOL_TASK, RESULT_TYPE>[],
  index: number,
) => Worker<POOL_TASK, RESULT_TYPE>;
