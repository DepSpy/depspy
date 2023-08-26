import { useTranslation } from "react-i18next";
import "../config";
import { useStore } from "@/contexts";

const useLanguage = () => {
  const { language, setLanguage: setContextLanguage } = useStore(
    (state) => state,
  );
  const { t, i18n } = useTranslation();

  function toggleLanguage() {
    const prevLanguage = language;
    const newLanguage = prevLanguage === "zh" ? "en" : "zh";
    setContextLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  }

  function initLanguage() {
    const language = localStorage.getItem("language");
    if (language) {
      setContextLanguage(language);
      i18n.changeLanguage(language);
    }
  }

  return { t, toggleLanguage, initLanguage };
};

export default useLanguage;
