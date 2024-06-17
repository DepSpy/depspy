import { useStore } from "@/contexts";
import { shallow } from "zustand/shallow";
import useLanguage from "@/i18n/hooks/useLanguage";
import Loading from "@/components/Loading";
export default function Depth() {
  const { depth, rootLoading, setRootLoading, setDepth } = useStore(
    (state) => state,
    shallow,
  );
  const { t } = useLanguage();
  return (
    <section
      id={`${t("section.maxDepth")}`}
      className={`relative
      hover:after:(absolute flex c-primary-hover text-nowrap left-50% transform-translate-x--50%
      content-[attr(id)])`}
    >
      {rootLoading ? (
        <Loading />
      ) : (
        <input
          id="depth"
          type="number"
          min={1}
          defaultValue={depth}
          onBlur={(e) => {
            setDepth(parseInt(e.target.value));
            setRootLoading(true);
          }}
          className="p-1 h-2rem w-5rem outline-primary-base text-center text-text bg-bg-container"
          border="solid 2 rd-0.5rem primary-border-hover hover:primary-hover"
        ></input>
      )}
    </section>
  );
}
