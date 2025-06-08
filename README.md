<p align="center">
  <img src="https://cheerioinf-img.oss-cn-beijing.aliyuncs.com/img/logo_light_small.svg" alt="logo" width="400" />
</ p>

## 简介
`DepSpy` 意为**依赖间谍** ( <font color= #5b2eee>**Dep**</font>endency <font color= #5b2eee>**Spy**</font> ) 是一款面向前端的专业依赖分析与可视化工具，旨在降低项目上线风险并优化第三方依赖管理。核心功能包括：

- **源码分析**：适配主流构建工具，自动解析源码的 [<font color= #5b2eee>**真实源码依赖树**</font>](#真实依赖树) ，利用 Git 的变更信息结合 Rolldown 实现 [<font color= #5b2eee>**函数粒度**</font>](#函数粒度) 的 Treeshaking，从影响源 (正向) 和影响面 (反向) [<font color= #5b2eee>**双视角**</font>](#双视角) 可视化依赖关系，并引入大模型进行风险评估，显著提升MR效率。

- **包分析**：兼容 npm，yarn，pnpm 等主流包管理器，直观展示项目[ <font color= #5b2eee>**真实包依赖树**</font>](#真实依赖树)，助力依赖优化与管理。

## 特点

- 🪴 清晰的树图：树图+剪枝代替有向图，避免错综复杂的图结构
- 💻 极致的性能：基于 Rust 的工具链，增量构建，多线程/多域名的充分并发
- 👨‍👩‍👧‍👦 丰富的视图：可折叠树，Diff 面板，体积块状图，抽屉嵌套列表等
- 🛠️ 精准的数据：基于构建工具实现，是运行时真实的依赖结构
- 🌐 兼容的环境：兼容前端主流方案，Vite/Webpack/Rspack + Vue/React
- 🌍 友好的体验：接入大模型，提供国际化，暗黑模式，本地/在线双模式

## 快速开始
将 DepSpy 安装到项目，使用 `PNPM`：

```bash
$ pnpm add @dep-spy/cli -D
```

之后你可以在 `npm` 脚本添加使用 `ds` 或者 `depspy` 脚本，以下是推荐配置脚本：

```js
{
  "scripts": {
    "ds": "ds"
    // 或者 "ds": "depspy"
  }
}
```
### 源码分析

添加项目对应构建工具的DepSpy插件
```js
export { vitePluginDepSpy } from "@dep-spy/cli";
// export { webpackPluginDepSpy } from "@dep-spy/cli";
// export { rspackPluginDepSpy } from "@dep-spy/cli";
export default defineConfig(() => {
  return {
    plugins: [
      vitePluginDepSpy()
    ],
  };
});
```
运行 static 命令，参数带上项目构建命令
> 也可以在配置中事先预置构建命令，见 [配置文件](#配置文件)
```bash
$ pnpm run ds static "pnpm run build"
```
分析完成后 `http://localhost:2023/static-analyze` 即可访问源码分析页

![ui](https://pic1.imgdb.cn/item/682dfbb058cb8da5c8037c60.png)

### 包分析

包分析不需要添加插件，直接在命令行中运行：

```bash
$ pnpm run ds
```

分析完成后 `http://localhost:2023/analyze` 即可访问包分析页

![ui](https://cheerioinf-img.oss-cn-beijing.aliyuncs.com/img/image-20230828225639712%202.png)
>[线上查询页](https://depspy.github.io/search)



## 配置

### 配置文件

从命令行运行 `ds` 时，DepSpy会自动尝试解析项目根目录下名为 `dep-spy.config.mjs` 的配置文件。

最基本的配置文件是这样的

```javascript
import { defineConfig } from "@dep-spy/cli";

export default defineConfig({
  // config options
});
```

### 命令行配置

Example:

```bash
ds --depth 3 --graph my-graph.json
```

### 默认配置

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
### 插件配置
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

## 相关概念

### 真实依赖树

真实(源码/包)依赖树代表项目运行时真正依赖的(源码/包)，最能反应项目真实情况的结构。

**源码不准确**：在代码中声明`import { get } from "ladash"`，如果没有使用get，则会被treeShaking掉，或者React框架会在每一个`jsx`文件上方自动加入`import React from "react"`，这些情况都会导致声明和真实依赖不准确的情况

**包不准确**：在 `package.json` 中声明了 `"chalk": "^4.1.2"`，其中 `^` 表示兼容版本，具体兼容哪些版本取决于语义化版本规则。以 `^4.1.2` 为例，表示兼容 `>=4.1.2 <5.0.0` 的所有版本，因此实际运行时可能安装的是 `4.1.5`、`4.5.0` 等符合范围的最新版本。


### 函数粒度

当一个文件有多个导出时，DepSpy会通过Git改动，精准判断哪些导出收到了影响，不会简单的认为一个文件改动，所有导出都收到影响，收束了影响面，极大的降低了开发者Review代码的心智负担。

### 双视角

一共有两种情况会影响文件，两种情况衍生出两种分析改动的视角
  - **影响源（正向）**
  
    文件本身源码发生了改动，专注于改动文件本身，其子节点是导入了该改动文件的依赖文件，方便我们快速锁定该文件的影响面。

  - **影响面（反向）**
  
    文件本身源码没有改动，但是导入的依赖发生了改动，专注于导入的依赖发生了改动的文件，其子节点就是该文件导入的变动文件，方便我们快速锁定该文件的影响源。

### 相同依赖和循环依赖

#### 相同依赖

对于不同依赖引入了相同的子依赖（依赖 + 版本都相同），这些子依赖被称为相同依赖。

![co](https://cheerioinf-img.oss-cn-beijing.aliyuncs.com/img/image-20230828230956388.png)

如图 `vite-node@0.34.3` 和 `@vitest/snapshot@0.34.3` 都引入了 `pathe@^1.1.1`，那么我们就称 `pathe@1.1.1` 为相同依赖。

对于这样的相同依赖，我们展示在侧边栏 `LIST -> DUPLICATED DEPENDENCY` 中，选中后将会**在树状渲染区高亮所有同一个相同依赖**。

并且**默认选中第一个相同依赖**，展示信息。

依靠相同依赖，我们在树中实现“剪枝”的效果，使树结构更加清晰，避免了有向图中相同依赖箭头指向杂乱无章的情况。

#### 循环依赖

对于一个依赖，如果这个依赖或依赖的子依赖，又依赖了本身，那么我们称为循环依赖。

![circle](https://cheerioinf-img.oss-cn-beijing.aliyuncs.com/img/image-20230828231818539.png)

如图，`mlly@1.4.1` 的子依赖又依赖了 `mlly@1.4.1`，此时我们在侧边栏 `LIST -> CIRCULAR DEPENDENCY` 中选中后，会**在树状渲染区使靠后的循环依赖节点指向前面的循环依赖节点**。

并且**默认选中靠后的循环依赖**，展示信息。

### 声明依赖版本和真实依赖版本

#### 声明依赖版本

对于 `package.json` 的 `dependencies` 中依赖版本，会出现如 `~`、`^`、`*`、`<=` 等表示安装依赖版本范围的符号，我们把这种**带符号的版本称为声明依赖版本**。

#### 真实依赖版本

在项目初次安装 `npm` 包的时候，根据声明依赖版本匹配到最新版本进行安装。

对于 `npm` 类的包管理器，采用扁平化的方式下载依赖，根据下载顺序的不同会影响到真实安装依赖的版本的选择。

对于 `pnpm` 类的包管理器，采用软链接的形式连接各个依赖，真实下载依赖版本同样受安装顺序的影响。

故为了避免项目每次重新安装版本不同，初次安装后生成 `lock` 文件，当存在 `lock` 文件时会匹配 `lock` 文件里的版本。

我们把这种**真实安装到本地的依赖版本称为真实依赖版本**。

DepSpy 中，我们默认展示声明依赖版本，当我们 `hover` 到树状渲染区的节点时，会显示出真实依赖版本，或者直接在侧边栏查看 `MODULE` 中的版本信息。

## 接口

使用 `core` 包可以脱离 `cli` 包使用 `DepSpy` 的核心功能.

```bash
  pnpm add @dep-spy/core
```
### 源码分析
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

### 包分析
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
