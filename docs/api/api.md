# 接口

使用 `core` 包可以脱离 `cli` 包使用 `DepSpy` 的核心功能.

- 引入

```bash
  pnpm add @dep-spy/core
```

```javascript
import { generateGraph } from "@dep-spy/core";
```

- 生成 `Graph` 对象

  - 第一个参数是项目的名称
  - 第二个参数是配置 (同[默认配置](/config/config.html#%E9%BB%98%E8%AE%A4%E9%85%8D%E7%BD%AE))

```javascript
const graph = generateGraph("", config);
```

- 调用 `graph` 对象的方法进行交互

```javascript
await graph.getGraph(); //获取树结构的json对象
await graph.getCodependency(); //获取所有相同依赖节点对象
await graph.getCircularDependency(); //获取所有循环节点数组
await graph.outputToFile(); //根据配置输出对应文件
```
