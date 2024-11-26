# 配置

## 配置文件

从命令行运行 `ds` 时，DepSpy会自动尝试解析项目根目录下名为 `dep-spy.config.mjs` 的配置文件。

最基本的配置文件是这样的:

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
  output: {
    graph: "ds.graph.json", // 依赖图输出路径
    circularDependency: "ds.circular.json", // 循环依赖输出路径
    codependency: "ds.co.json", // 相同依赖输出路径
  },
};
```

> 优先级: 命令行 > 配置文件 > 默认配置
