import { Tree } from "../../components/Tree";
import { useStore } from "../../contexts";
import Sidebar from "./Sidebar";
import useLanguage from "../../i18n/hooks/useLanguage";

export default function AnalyzePage() {
  const root = useStore((state) => state.root);
  const { theme, setTheme } = useStore();
  const { t, toggleLanguage } = useLanguage();

  const toggleMode = () => {
    setTheme(theme);
  };

  return (
    <>
      <div className="fixed">
        <button onClick={toggleLanguage}>切换语言</button>
        <button onClick={toggleMode}>切换模式</button>
        <p className={`bg-primary-bg c-text`}>{t("section.depth")}</p>
      </div>
      <div className="flex h-screen overflow-hidden">
        <Tree originalData={root}></Tree>
        <Sidebar />
      </div>
    </>
  );
}
