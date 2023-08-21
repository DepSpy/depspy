import { useNavigate } from "react-router-dom";
import { useStore } from "@/contexts";
import { useEffect, useReducer } from "react";
import { Node } from "~/types";
import { ReducerType } from "~/searchSide";
import styles from "./index.module.scss";

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
  const { root, setSelectNode, searchNode } = useStore();
  const [state, dispatch] = useReducer<ReducerType>(reducer, {
    keywords: "",
    loading: true,
    nodes: [],
  });
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/search");
  };
  const searchHandler = (node: Node) => {
    if (node !== null) setSelectNode(node);
    dispatch([
      { type: "keywords", value: "" },
      { type: "nodes", value: [] },
    ]);
  };
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
        <h1>Find Modules</h1>
        <div className={styles["search-bar"]}>
          <input
            onChange={(e) =>
              dispatch({ type: "keywords", value: e.currentTarget.value })
            }
            value={state.keywords}
            type="text"
            name="search"
            autoComplete="off"
          />
        </div>
      </div>
      <div className={styles["result"]}>
        <h1>Similar Result</h1>
        <ul>
          {state.nodes.map((v, i) => (
            <li key={i} onClick={() => searchHandler(v)}>
              {v.name}
            </li>
          ))}
        </ul>
      </div>
      <div onClick={() => handleClick()}>back to SearchPage</div>
    </div>
  );
}
