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

export function GithubIcon() {
  return (
    <div>
      <button
        className="i-carbon-logo-github text-icon h-30px w-30px hover:text-icon-hover m-2"
        onClick={() => {
          window.open("https://github.com/DepSpy/depspy", "_blank");
        }}
      />
    </div>
  );
}
