---
title: 配置
---

# 配置

## 配置文件

从命令行运行 `ds` 时，DepSpy会自动尝试解析项目根目录下名为 `dep-spy.config.mjs` 的配置文件。

最基本的配置文件是这样的

```javascript
import { defineConfig } from "@dep-spy/cli";

export default defineConfig({
  // config options
});
```

## 命令行配置

Example:

```bash
ds --depth 3 --graph my-graph.json
```

## 默认配置

```javascript
{
  depth: 3, // 最大嵌套深度
  size: false, // 是否计算体积
  entry: "", // 项目入口
  command: "", // 项目构建命令
  output: {
    graph: "ds.graph.json", // 依赖图输出路径
    staticGraph: "ds.static.json", // 源码分析输出路径
    circularDependency: "ds.circular.json", // 循环依赖输出路径
    codependency: "ds.co.json", // 相同依赖输出路径
  },
};
```

> 优先级: 命令行 > 配置文件 > 默认配置

## 插件配置
```ts
export interface PluginDepSpyConfig {
  // 项目的入口，默认为index.html
  entry?: string;
  // 忽略的文件路径，正则用test，字符串用includes
  ignores?: (string | RegExp)[];
  // 对比版本的commit hash
  commitHash?: string;
}
```