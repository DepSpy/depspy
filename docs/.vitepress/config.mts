import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "DepSpy",
  description: "DepSpy is a tool for analyzing dependencies in npm packages.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      { text: "文档", link: "/guide/get-started" },
    ],
    logo: "../icon.svg",

    sidebar: [
      {
        text: "指南",
        base: "/guide/",
        items: [{ text: "快速开始", link: "get-started" }],
      },
      {
        text: "概念",
        base: "/concepts/",
        items: [
          { text: "源码分析", link: "static" },
          { text: "相同依赖和循环依赖", link: "dependence" },
          { text: "声明依赖版本和真实依赖版本", link: "version" },
          { text: "npm 类和 pnpm 类查找差异", link: "find" },
          { text: "view 层的全局状态管理", link: "status" },
        ],
      },
      {
        text: "配置",
        base: "/config/",
        items: [{ text: "相关配置", link: "config" }],
      },
      {
        text: "API",
        base: "/api/",
        items: [{ text: "相关API", link: "api" }],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/DepSpy/depspy" }],
  },
});
