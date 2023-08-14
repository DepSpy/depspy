import { useNavigate } from "react-router-dom";
import { useStore } from "@/contexts";
import { searchNode } from "./utils";
import { useReducer } from "react";
import { StateType, ActionType } from "./types";

function reducer(state: StateType, action: ActionType) {
  switch (action.type) {
    case "keywords":
      return { ...state, keywords: action.value };
    default:
      break;
  }
  return state;
}

export default function SideSearch() {
  const { root, setSelectNode } = useStore();
  const [state, dispatch] = useReducer<
    (state: StateType, action: ActionType) => StateType
  >(reducer, { keywords: "" });
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/search");
  };
  const searchHandler = () => {
    const node = searchNode(root, state.keywords);
    if (node !== null) setSelectNode(node);
    dispatch({ type: "keywords", value: "" });
  };
  return (
    <div>
      <div>
        <input
          onChange={(e) =>
            dispatch({ type: "keywords", value: e.currentTarget.value })
          }
          value={state.keywords}
          type="text"
          name="search"
          autoComplete="off"
        />
        <button onClick={searchHandler}>search</button>
      </div>
      <div onClick={() => handleClick()}>back to SearchPage</div>
    </div>
  );
}
