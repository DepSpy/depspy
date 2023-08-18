import { useState } from "react";
import { Tree } from "../../components/Tree";
import { useStore } from "../../contexts";
import Sidebar from "./Sidebar";
import useLanguage from "../../i18n/hooks/useLanguage";

export default function AnalyzePage() {
  const root = useStore((state) => state.root);
  const { t, toggleLanguage } = useLanguage();
  const [mode, setMode] = useState<string>("light");

  const toggleMode = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
  };

  return (
    <div className="h-screen overflow-hidden">
      <button onClick={toggleLanguage}>切换语言</button>
      <button onClick={toggleMode}>切换模式</button>
      <p className={`bg-${mode}-bg c-${mode}-text`}>
        This is primary text-{mode}
      </p>
      <div>{t("section.depth")}</div>
      <Tree originalData={root}></Tree>
      <Sidebar />
    </div>
  );
}
