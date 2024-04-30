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
export type Package_TYPE = MODULE_INFO_TYPE & Record<string, unknown>;

export interface CONFIG {
  baseDir?: string;
  size?: boolean;
}

export enum PATH_TYPE {
  Resolve,
  Relative,
  BARE,
  ALIAS,
}

export interface CODE_INFO {
  imports: string[];
  exports: string[];
}
