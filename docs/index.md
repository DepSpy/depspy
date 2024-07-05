---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "DepSpy"
  text: "依赖间谍"
  tagline: 具有能够按照任意深度潜入分析和监视其他 npm 依赖的能力，并提供状态同步的各类可视化交互页面
  image:
    src: /icon.svg
    alt: DepSpy
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/get-started
    - theme: alt
      text: 相关概念
      link: /concepts/dependence

features:
  - icon: 🪴
    title: 清晰的结构
    details: 利用树 + 剪枝代替有向图，支持任意展开、折叠节点，结构更加清晰，规避了有向图错乱复杂的箭头指向
  - icon: 💻
    title: 极致的性能
    details: 利用多线程+缓存（本地），多域名（线上）充分并发，更新时增量构建避免重复构建
  - icon: 👨‍👩‍👧‍👦
    title: 丰富的视图
    details: 提供多种展示方式，包括可折叠树、体积块状图、抽屉嵌套列表等
  - icon: 🛠️
    title: 完备的数据
    details: 支持分析相同依赖和循环依赖，支持搜索子依赖、查看依赖信息和体积等
  - icon: 🌐
    title: 兼容的环境
    details: 支持本地 CLI 和在线查询两种模式。
  - icon: 🌍
    title: 友好的体验
    details: 支持国际化和暗黑模式
---
