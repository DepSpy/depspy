import { LanguageIcon, ThemeIcon } from "@/components/icon/index";
import useLanguage from "@/i18n/hooks/useLanguage";
import "./index.scss";
export default function Skeleton() {
  const { t } = useLanguage();
  return (
    <section className="relative w-100vw h-100vh bg-bg-container">
      <div className="fixed flex p-5">
        <LanguageIcon />
        <ThemeIcon />
      </div>
      <section
        className="fixed flex left-2rem bottom-2rem gap-4 h-2rem"
        flex="items-end"
      >
        <div className="w-5rem h-2rem left-bottom-item"></div>
        <div className="w-5rem h-2rem left-bottom-item"></div>
        <div className="w-5rem h-2rem left-bottom-item"></div>
      </section>
      <section
        id={`${t("skeleton.tip")}`}
        className="fixed 
          left-50%
          top-50%
          transform-translate--50%
          before:(absolute 
          content-[attr(id)] 
          top--8 
          c-[var(--color-text)]
          text-nowrap
          transform-translate-x--50% 
          font-size-8 
          left-50%)
          "
      >
        <div
          className=" 
          c-[var(--color-skeleton-bg)]
          font-size-50
          i-carbon-decision-tree 
          left-bottom-item"
        ></div>
      </section>
      <section
        className="
          fixed
          display-none
          lg:flex
          items-center
          flex-col
          p-1rem
          right-0
          h-100vh
          w-20vw 
          border-solid
          border-1
          border-[var(--color-skeleton-bg)]"
      >
        {Array(3)
          .fill(0)
          .map(() => {
            return (
              <div
                className="
                m-t-2
                w-100% 
                h-1.5rem
                left-bottom-item"
              ></div>
            );
          })}
        {Array(2)
          .fill(0)
          .map(() => {
            return (
              <div
                className="
              c-[var(--color-skeleton-bg)]
              font-size-[calc(20vw-2rem)]
              i-carbon-list
              left-bottom-item"
              ></div>
            );
          })}
      </section>
    </section>
  );
}
