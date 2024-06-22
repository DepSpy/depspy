<p align="center">
  <img src="https://cheerioinf-img.oss-cn-beijing.aliyuncs.com/img/logo_light_small.svg" alt="logo" width="400" />
</ p>

## 简介

`DepSpy` 意为**依赖间谍** [ **Dep**endence **Spy** ]，具有能够按照任意深度 [ **Dep**th ] 潜入分析和监视其他 `npm/ yarn/ pnpm` 依赖的能力，并提供状态同步的各类可视化交互页面，以及本地 `CLI` 和线上查询两种方式。

## 特点

1. 🪴 利用树 + 剪枝代替有向图，支持任意展开、折叠节点，结构更加清晰，规避了有向图错乱复杂的箭头指向。
2. 👨‍👩‍👧‍👦 提供多种展示方式，包括可折叠树、体积块状图、抽屉嵌套列表等。
3. 🛠️ 支持分析相同依赖和循环依赖，支持搜索子依赖、查看依赖信息和体积等。
4. 💻 利用 `ws` 服务器，实时操作 `depth` 深度，监听依赖变化，实时更新。并实现分析包 `size` 的懒加载。
5. 🌐 支持本地 `CLI` 和在线查询两种模式。
6. 🌍 支持国际化和暗黑模式。

## 快速开始

### 本地 `CLI`

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

如果想根据默认配置直接生成依赖分析 `JSON` 文件，直接在命令行中运行：

```bash
$ pnpm run ds
```

如果需要届时开启 UI 页面，请格外传入 `--ui` 参数（对于更多配置参数，或使用配置文件进行配置，请查看[配置](#配置)）：

```bash
$ pnpm run ds --ui
```

接着你能通过 `http://localhost:2023/analyze` 访问 DepSpy UI 页面：

![ui](https://cheerioinf-img.oss-cn-beijing.aliyuncs.com/img/image-20230828225639712%202.png)

推荐使用上述方法，但也支持使用 `npx @dep-spy/cli` 来直接运行 DepSpy。

### 线上查询

[线上查询页](https://depspy.github.io/search)

支持包名查询、上传 `pacakge.json` 文件两种方式。

![image-20230829145132092](https://cheerioinf-img.oss-cn-beijing.aliyuncs.com/img/image-20230829145132092.png)

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
  size: false, // 是否计算size
  output: {
    graph: "ds.graph.json", // 依赖图输出路径
    circularDependency: "ds.circular.json", // 循环依赖输出路径
    codependency: "ds.co.json", // 相同依赖输出路径
  },
};
```

> 优先级: 命令行 > 配置文件 > 默认配置

## 相关概念

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

- 引入

```bash
  pnpm add @dep-spy/core
```

```javascript
import { generateGraph } from "@dep-spy/core";
```

- 生成 `Graph` 对象

  - 第一个参数是项目的名称
  - 第二个参数是配置 (同上[默认配置](#默认配置))

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
