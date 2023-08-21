import useLanguage from "@/i18n/hooks/useLanguage";
import { useStore } from "@/contexts";
export default function Collapse() {
  const { t } = useLanguage();
  const { collapse, setCollapse } = useStore((state) => ({
    collapse: state.collapse,
    setCollapse: state.setCollapse,
  }));
  return (
    <section
      id={`${collapse ? t("section.expand") : t("section.collapse")}`}
      className={`relative
      hover:after:(absolute flex c-primary-hover text-nowrap left-50% transform-translate-x--50%
      content-[attr(id)])`}
    >
      <div
        onClick={() => setCollapse(!collapse)}
        className={`
          ${
            collapse
              ? "i-carbon-expand-categories"
              : "i-carbon-collapse-categories"
          }
          text-1.5rem 
          c-primary-border 
          hover:c-primary-border-hover`}
      ></div>
    </section>
  );
}
