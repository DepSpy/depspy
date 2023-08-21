// import { useState } from "react";
import useLanguage from "@/i18n/hooks/useLanguage";
export default function Depth() {
  // const [depth, setDepth] = useState(3);
  const { t } = useLanguage();
  return (
    <section
      id={`${t("section.maxDepth")}`}
      className={`relative
      hover:after:(absolute flex c-primary-hover text-nowrap left-50% transform-translate-x--50%
      content-[attr(id)])`}
    >
      <input
        id="depth"
        type="number"
        min={2}
        defaultValue={3}
        className="  
        p-1
        h-2rem
        w-5rem
        outline-primary-base
        text-center
        "
        border="solid 2 rd-0.5rem primary-border hover:primary-border-hover"
      ></input>
    </section>
  );
}
