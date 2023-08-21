import {
  defineConfig,
  presetAttributify,
  presetUno,
  presetIcons,
} from "unocss";

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({ scale: 1.2, warn: true }),
  ],
  shortcuts: [],
  rules: [],
  theme: {
    colors: {
      primaryBg: "var(--color-primary-bg)",
      primaryBgHover: "var(--color-primary-bg-hover)",
      primaryBorder: "var(--color-primary-border)",
      primaryBorderHover: "var(--color-primary-border-hover)",
      primaryHover: "var(--color-primary-hover)",
      primaryBase: "var(--color-primary-base)",
      primaryActive: "var(--color-primary-active)",
      primaryText: "var(--color-primary-text)",
      primaryTextHover: "var(--color-primary-text-active)",
      primaryTextActive: "var(--color-primary-border)",
      text: "var(--color-text)",
      textDescription: "var(--color-text-description)",
      icon: "var(--color-icon)",
      iconHover: "var(--color-icon-hover)",
      bgContainer: "var(--color-bg-container)",
      bgLayout: "var(--color-bg-layout)",
      itemBgHover: "var(--control-item-bg-hover)",
      itemBgActive: "var(--control-item-bg-active)",
      itemBgActiveHover: "var(--control-item-bg-active-hover)",
      border: "var(--color-border)",
      borderSecondary: "var(--color-border-secondary)",
    },
  },
});
