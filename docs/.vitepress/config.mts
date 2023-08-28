import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "DepSpy Docs",
  description: "依赖间谍",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [{ text: "Home", link: "/" }],

    sidebar: [
      {
        text: "Guid",
        base: "guid",
        items: [
          { text: "Concepts", link: "/concepts" },
          { text: "Get Started", link: "/get-started" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/DepSpy/depspy" }],
  },
});
