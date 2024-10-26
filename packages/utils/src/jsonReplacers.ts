// 链式调用handlers
import { jsonOptions } from "./type";

export function compose(
  jsonHandlers: ((
    key: string,
    value: unknown,
    options: jsonOptions,
  ) => unknown)[],
  options: jsonOptions = {},
) {
  return function (key: string, value: unknown) {
    return jsonHandlers.reduce((_, handler) => {
      return handler.call(this, key, value, options);
    }, value);
  };
}

export function toInfinity(key: string, value: unknown): unknown {
  //当为Infinity时需要特殊处理，否则会变成null
  if (key === "childrenNumber" && value === Infinity) {
    if (value === Infinity) {
      return "Infinity";
    } else if (value === null) {
      return Infinity;
    }
  }

  return value;
}

export function limitDepth(
  key: string,
  value: unknown,
  options: jsonOptions = {},
) {
  //当达到层数时，截断，不再json化
  if (
    key === "dependencies" &&
    this.path &&
    this.path.length === options.depth
  ) {
    return {};
  }

  return value;
}

export function reduceKey(
  key: string,
  value: unknown,
  options: jsonOptions = {},
) {
  // 判断当前是否为Node
  if (!(this.dependencies && this.dependenciesList)) return value;
  const { internalKeys, externalKeys } = options;
  // 优先生效
  if (internalKeys && internalKeys.includes(key)) {
    return value;
  }
  if (externalKeys && !externalKeys.includes(key)) {
    return value;
  }
}
