import {
  defineConfig,
  presetAttributify,
  presetUno,
  presetIcons,
} from "unocss";
import transformerVariantGroup from "@unocss/transformer-variant-group";
export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({ scale: 1.2, warn: true }),
  ],
  transformers: [transformerVariantGroup()],
  shortcuts: [],
  rules: [],
  theme: {
    colors: {
      light: {
        bg: "#E6E2F2",
        bgHover: "#CABEF3",
        border: "#A992F6",
        borderHover: "#8F71F3",
        hover: "#7550F1",
        base: "#5B2EEE",
        active: "#3A0FC6",
        textHover: "#260A84",
        text: "#1D0763",
        textActive: "#130542",
        icon: "#00000073",
        iconHover: "#000000e0",
      },
      dark: {
        bg: "#000000",
        bgHover: "#CABEF3",
        border: "#00000026",
        borderHover: "#8F71F3",
        hover: "#7550F1",
        base: "#5B2EEE",
        active: "#3A0FC6",
        textHover: "#260A84",
        text: "#fff",
        textActive: "#130542",
        icon: "#00000073",
        iconHover: "#000000e0",
      },
    },
  },
});
