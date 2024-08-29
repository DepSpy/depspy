import useLanguage from "@/i18n/hooks/useLanguage";
import { useStore } from "@/contexts";
import { getNode } from "@/contexts/api";
export default function Collapse() {
  const { t } = useLanguage();
  const { root, setRoot, collapse, setCollapse } = useStore((state) => ({
    collapse: state.collapse,
    setCollapse: state.setCollapse,
    root: state.root,
    setRoot: state.setRoot,
  }));
  return (
    <section
      id={`${collapse ? t("section.expand") : t("section.collapse")}`}
      className={`relative
      hover:after:(absolute flex c-primary-hover text-nowrap left-50% transform-translate-x--50%
      content-[attr(id)])`}
    >
      <div
        onClick={() => {
          if (collapse) {
            const deps = root.dependencies;
            Promise.all(
              Object.values(deps).map(async (dep) => {
                const res = await getNode({
                  id: dep.name + dep.declarationVersion,
                  depth: dep.path.length + 100,
                  path: dep.path ? dep.path : "",
                });
                dep.dependencies = res.data.dependencies;
                return dep
              }),
            ).then(() => {
              setRoot({ ...root });
              setCollapse(!collapse);
            });
          } else {
            setCollapse(!collapse);
          }
        }}
        className={`
          ${
            collapse
              ? "i-carbon-expand-categories"
              : "i-carbon-collapse-categories"
          }
          text-1.5rem 
          c-primary-border-hover
          hover:c-primary-border-hover`}
      ></div>
    </section>
  );
}
