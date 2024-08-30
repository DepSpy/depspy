import useLanguage from "@/i18n/hooks/useLanguage";
import { useStore } from "@/contexts";
import { getNode } from "@/contexts/api";
import { Node } from "~/types";
export default function Collapse() {
  const { t } = useLanguage();
  const { root, setRoot, collapse, setCollapse } = useStore((state) => ({
    collapse: state.collapse,
    setCollapse: state.setCollapse,
    root: state.root,
    setRoot: state.setRoot,
  }));
  async function dfs(roots: Node[]) {
    const deps: Node[] = [];
    function dfsKid(node: Node) {
      if(!node || !node.dependencies) return;
      if (Object.values(node.dependencies).length === 0) {

        deps.push(node);
        return;
      }
      for (let v of Object.values(node.dependencies)) {
        dfsKid(v);
      }
    }
    for (const root of roots) {
      dfsKid(root);
    }
    const d = (await Promise.all(
      Object.values(deps)
        .filter((dep) => Object.values((dep as any).dependenciesList).length)
        .map(async (dep) => {
          const res = await getNode({
            id: dep.name + dep.declarationVersion,
            depth: 3,
            path: dep.path ? dep.path : "",
          });
          dep.dependencies = res.data.dependencies;

          return dep;
        }),
    )).filter(dep => dep && dep.dependencies && Object.values(dep.dependencies).length);
    console.log(d.length, Object.values(deps).length);
    

    if (d.length) {
      dfs(d); // 递归
      return;
    }
    setRoot({ ...root });
    setCollapse(!collapse);
  }
  return (
    <section
      id={`${collapse ? t("section.expand") : t("section.collapse")}`}
      className={`relative
      hover:after:(absolute flex c-primary-hover text-nowrap left-50% transform-translate-x--50%
      content-[attr(id)])`}
    >
      <div
        onClick={async () => {
          if (collapse) {
            await dfs([root]);
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
