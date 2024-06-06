import { useStore } from "@/contexts";
import useLanguage from "@/i18n/hooks/useLanguage";
import FirstTreeMap from "../FirstTreeMap";
import "./index.scss";

export default function SideModule() {
  const { t } = useLanguage();
  const { selectedNode, selectedSizeNode } = useStore((state) => state);
  return (
    <div>
      <div className="module-title">{t("aside.module.information")}</div>
      <div className="flex">
        <div className="module-info-name">{selectedNode.name}</div>
        <div className="module-info-version">
          {selectedNode.declarationVersion
            ? "@" + selectedNode.declarationVersion
            : ""}
          ({selectedNode.version})
        </div>
      </div>
      {selectedNode.description ? (
        <div className="module-des">
          <div className="title">{t("aside.module.description")}</div>
          <div className="des">{selectedNode.description}</div>
        </div>
      ) : null}
      {selectedNode.dependencies ? (
        <div className="module-size">
          <div className="title">{t("aside.module.dependencies")}</div>
          <div className="cache p-3">
            {Object.keys(selectedNode.dependencies).length}&nbsp;/&nbsp;
            {selectedNode.childrenNumber}
          </div>
        </div>
      ) : null}
      {selectedNode.cache ? (
        <div className="module-size">
          <div className="title">{t("aside.module.cache")}</div>
          <div className=" cache p-3 module-dep-item">true</div>
        </div>
      ) : null}
      {selectedNode.circlePath ? (
        <div className="module-size">
          <div className="title">{t("aside.module.circlePath")}</div>
          <div className=" cache p-3 module-dep-item">true</div>
        </div>
      ) : null}
      {selectedSizeNode && selectedSizeNode.size ? (
        <div className="module-size">
          <div className="title">{t("aside.module.size")}</div>
          <div className="size">{selectedSizeNode.size}</div>
        </div>
      ) : null}
      <div className="size-graph-title">{t("aside.module.graph")}</div>
      <div className="flex justify-center">
        <FirstTreeMap width={376} height={376} RectFontSize={14}></FirstTreeMap>
      </div>
    </div>
  );
}
