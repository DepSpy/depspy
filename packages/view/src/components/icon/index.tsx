import useLanguage from "@/i18n/hooks/useLanguage";
import "./index.scss";
import { useStore } from "@/contexts";

export function LanguageIcon() {
  const { t, toggleLanguage } = useLanguage();
  return (
    <button
      className={`i-icon-park-outline-${
        t("mode.language") === "ENGLISH" ? "english" : "chinese"
      }`}
      onClick={toggleLanguage}
    />
  );
}

export function ThemeIcon() {
  const { theme, setTheme } = useStore((state) => state);
  const toggleMode = () => {
    setTheme(theme);
  };
  return (
    <button className={`i-ic-baseline-${theme}-mode`} onClick={toggleMode} />
  );
}
