# 接口

使用 `core` 包可以脱离 `cli` 包使用 `DepSpy` 的核心功能.

```bash
  pnpm add @dep-spy/core
```
## 源码分析
如果内置支持的构建工具不能满足需求，可以考虑自定义适配器或者提issue
```js
import {
  StaticGraph,
  getAllExportEffect,
  sendDataByChunk,
  SourceToImportId
} from "@dep-spy/core";
export function xxxPlugin(){
        // 生成依赖图
      const staticGraph = new StaticGraph(
        options,// 插件配置
        sourceToImportIdMap,// SourceToImportId的实例
        getModuleInfo,// 获取任意模块信息的函数
      );
      // 构建依赖图
      const graph = await staticGraph.generateGraph();
      // 分块发送数据给服务器
      await sendDataByChunk(Object.values(graph), "/collectBundle");
}

```

## 包分析
```javascript
import { generateGraph } from "@dep-spy/core";
```

1. 生成 `Graph` 对象

  - 第一个参数是项目的名称
  - 第二个参数是配置 (同上[默认配置](#默认配置))

```javascript
const graph = generateGraph("", config);
```

2. 调用 `graph` 对象的方法进行交互

```javascript
await graph.getGraph(); //获取树结构的json对象
await graph.getCodependency(); //获取所有相同依赖节点对象
await graph.getCircularDependency(); //获取所有循环节点数组
await graph.outputToFile(); //根据配置输出对应文件
```
