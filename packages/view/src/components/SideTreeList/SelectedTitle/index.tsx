import { useStore } from "../../../contexts";
import "./index.scss";
import useLanguage from "@/i18n/hooks/useLanguage";

export default function SelectedTitle() {
  const { t } = useLanguage();
  const { selectedNode } = useStore((state) => state);
  return (
    <div className="treelist-selected-title">
      <div>{t("aside.list.selected")}:</div>
      <div>
        {selectedNode?.name}@
        {selectedNode?.declarationVersion || selectedNode?.version}
      </div>
    </div>
  );
}
