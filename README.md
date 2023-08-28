# DepSpy

## 配置

### 配置文件

从命令行运行 `ds` 时，DepSpy会自动尝试解析项目根目录下名为 `dep-spy.config.mjs` 的配置文件。

最基本的配置文件是这样的

```javascript
import { defineConfig } from '@dep-spy/cli';

export default defineConfig({
    //config options
});
```

### 命令行配置

Example:

```bash
ds --depth 3 --size --graph my-graph.json
```

### 默认配置

```javascript
{
  depth: 3,//最大嵌套深度
  size: false,//是否计算size
  output: {
    graph: "ds.graph.json",//依赖图输出路径
    circularDependency: "ds.circular.json",//循环依赖输出路径
    codependency: "ds.co.json",//相同依赖输出路径
  },
};
```

> 优先级: 命令行>配置文件>默认配置

## 接口

使用`core`包可以脱离 `cli` 包使用 `DepSpy` 的核心功能.

- 引入

```bash
  pnpm add @dep-spy/core
```

```javascript
  import { generateGraph } from "@dep-spy/core";
```

- 生成Graph对象

  - 第一个参数是项目的名称
  - 第二个参数是配置 (同上[默认配置](#默认配置))

```javascript
const graph = generateGraph("", config);
```

- 调用graph对象的方法进行交互

```javascript
await graph.getGraph()//获取树结构的json对象
await graph.getCodependency()//获取所有相同依赖节点对象
await graph.getCircularDependency()//获取所有循环节点数组
await graph.outputToFile()//根据配置输出对应文件
```
