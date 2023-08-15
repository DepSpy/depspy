import { Tree } from "../../components/Tree";
import { useStore } from "../../contexts";
import Sidebar from "./Sidebar";
import useLanguage from "../../i18n/hooks/useLanguage";

export default function AnalyzePage() {
  const root = useStore((state) => state.root);
  const { t, toggleLanguage } = useLanguage();

  return (
    <div className="flex h-screen overflow-hidden">
      <button onClick={toggleLanguage}>切换语言</button>
      <div>{t("section.depth", { num: 1 })}</div>
      <Tree originalData={root}></Tree>
      <Sidebar />
    </div>
  );
}
