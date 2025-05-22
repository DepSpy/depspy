---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "DepSpy"
  text: "依赖间谍"
  tagline: 一款面向前端的专业依赖分析与可视化工具，旨在降低项目上线风险并优化第三方依赖管理
  image:
    src: /icon.svg
    alt: DepSpy
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/get-started
    - theme: alt
      text: 相关概念
      link: /concepts/static

features:
  - icon: 🪴
    title: 清晰的结构
    details: 树图+剪枝代替有向图，避免错综复杂的图结构
  - icon: 💻
    title: 极致的性能
    details: 基于 Rust 的工具链，增量构建，多线程/多域名的充分并发
  - icon: 👨‍👩‍👧‍👦
    title: 丰富的视图
    details: 可折叠树，Diff 面板，体积块状图，抽屉嵌套列表等
  - icon: 🛠️
    title: 完备的数据
    details: 基于构建工具实现，是运行时真实的依赖结构
  - icon: 🌐
    title: 兼容的环境
    details: 兼容前端主流方案，Vite/Webpack/Rspack + Vue/React
  - icon: 🌍
    title: 友好的体验
    details: 接入大模型，提供国际化，暗黑模式，本地/在线双模式
---
