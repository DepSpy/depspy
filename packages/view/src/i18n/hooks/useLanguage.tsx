import { useState } from "react";
import { useTranslation } from "react-i18next";
import "../config";

const useLanguage = () => {
  const { t, i18n } = useTranslation();
  const [, setLanguage] = useState("en");

  function toggleLanguage() {
    setLanguage((prevLanguage) => {
      const newLanguage = prevLanguage === "zh" ? "en" : "zh";
      i18n.changeLanguage(newLanguage);
      return newLanguage;
    });
  }

  return { t, toggleLanguage };
};

export default useLanguage;
