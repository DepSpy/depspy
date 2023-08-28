import useLanguage from "@/i18n/hooks/useLanguage";
import { useStore } from "@/contexts";
export default function SizeTree() {
  const { t } = useLanguage();
  const { sizeTree, setSizeTree } = useStore((state) => ({
    sizeTree: state.sizeTree,
    setSizeTree: state.setSizeTree,
  }));
  return (
    <section
      id={`${sizeTree ? t("section.rectTree") : t("section.plainTree")}`}
      className={`relative
      hover:after:(absolute flex c-primary-hover text-nowrap left-50% transform-translate-x--50%
      content-[attr(id)])`}
    >
      <div
        onClick={() => setSizeTree(!sizeTree)}
        className={`
          ${sizeTree ? "i-carbon-chart-treemap" : "i-carbon-decision-tree"}
          text-1.5rem 
          c-primary-border-hover
          hover:c-primary-border-hover`}
      ></div>
    </section>
  );
}
