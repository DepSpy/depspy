---
title: 快速开始
---

# 快速开始

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

