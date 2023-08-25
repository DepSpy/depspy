import { useStore } from "@/contexts";
import { useEffect, useMemo, useReducer } from "react";
import { Node } from "~/types";
import { ReducerType } from "~/searchSide";
import styles from "./index.module.scss";
import useLanguage from "@/i18n/hooks/useLanguage";
import { useNavigate } from "react-router-dom";

const reducer: ReducerType = (state, action) => {
  const newState = { ...state };
  if (action instanceof Array)
    action.forEach((v) => (newState[v.type] = v.value as never));
  else {
    newState[action.type] = action.value as never;
  }
  return newState;
};

export default function SideSearch() {
  const { t } = useLanguage();
  const { root, setSelectNode, searchNode } = useStore();
  const [state, dispatch] = useReducer<ReducerType>(reducer, {
    keywords: "",
    loading: true,
    nodes: [],
  });
  const navigation = useNavigate();
  const searchHandler = (node: Node) => {
    if (node !== null) setSelectNode(node);
    dispatch([
      { type: "keywords", value: "" },
      { type: "nodes", value: [] },
    ]);
  };
  const searchResults = useMemo(
    () => (
      <ul>
        {state.nodes.map((v, i) => (
          <li key={i} onClick={() => searchHandler(v)}>
            {v.name}
          </li>
        ))}
      </ul>
    ),
    [state.nodes],
  );
  useEffect(() => {
    if (state.keywords) {
      const suggestions = searchNode(root, state.keywords);
      dispatch({ type: "nodes", value: suggestions });
    } else if (!state.keywords) {
      dispatch({ type: "nodes", value: [] });
    } else dispatch({ type: "nodes", value: false });
  }, [state.keywords]);
  return (
    <div className={styles["side-search"]}>
      <div className={styles["find"]}>
        <div className={styles["title"]}>{t("aside.search.title")}</div>
        <div className={styles["search-bar"]}>
          <input
            onChange={(e) =>
              dispatch({ type: "keywords", value: e.currentTarget.value })
            }
            value={state.keywords}
            type="text"
            name="search"
            autoComplete="off"
            placeholder={t("aside.search.find")}
          />
        </div>
      </div>
      {!!state.nodes.length && (
        <div className={styles["result"]}>
          <div className={styles["title"]}>{t("aside.search.results")}</div>
          {!!state.nodes.length && searchResults}
        </div>
      )}
      <div
        className={styles["mainpage-title"]}
        onClick={() => {
          navigation("/search");
        }}
      >
        <span>{t("aside.search.mainpage")}</span>
      </div>
    </div>
  );
}
