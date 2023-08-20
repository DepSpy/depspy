import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import translation_en from "./en.json";
import translation_zh from "./zh.json";

i18n.use(initReactI18next).init({
  debug: true,
  fallbackLng: "en",
  interpolation: {
    escapeValue: true,
  },
  // language resources
  resources: {
    en: {
      translation: translation_en,
    },
    zh: {
      translation: translation_zh,
    },
  },
});

export default i18n;
