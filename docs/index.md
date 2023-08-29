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
    details: 利用树 + 剪枝代替有向图，支持任意展开、折叠节点，结构更加清晰，规避了有向图错乱复杂的箭头指向
  - icon: 👨‍👩‍👧‍👦
    details: 提供多种展示方式，包括可折叠树、体积块状图、抽屉嵌套列表等
  - icon: 🛠️
    details: 支持分析相同依赖和循环依赖，支持搜索子依赖、查看依赖信息和体积等
  - icon: 💻
    details: 利用 ws 服务器，实时操作 depth 深度，监听依赖变化，实时更新。并实现分析包 size 的懒加载
  - icon: 🌐
    details: 支持本地 CLI 和在线查询两种模式。
  - icon: 🌍
    details: 支持国际化和暗黑模式
---
