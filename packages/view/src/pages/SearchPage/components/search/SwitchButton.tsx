import React, { useContext } from "react";
import "./SwitchButton.scss";
import MainPageContext from "../store/MainPageContext";
import { useNavigate } from "react-router-dom";
import { generateGraphWrapper } from "../../util/GenerateGraphWrapper";
import { useStore } from "@/contexts";
interface SwitchProps {
  onDisplayDragAndDrop: () => void;
}

const SwitchButton: React.FC<SwitchProps> = ({ onDisplayDragAndDrop }) => {
  const navigate = useNavigate();
  const ctx = useContext(MainPageContext);
  const setInfo = useStore((state) => state.setInfo);
  const info = ctx.info;

  const addHistoryHandler = () => {
    if (info.length > 0) {
      ctx.onHistoryUpdate(info);
      generateGraphWrapper(info);
      navigate(`/analyze?q=${info}`);
      setInfo(info);
    }
  };

  return (
    <div className={"button-area"}>
      <div className={"button-container"}>
        <button
          className={"button-large-important"}
          onClick={addHistoryHandler}
        >
          {ctx.t("search.findDep")}
        </button>
        <button
          className={"button-large-default"}
          onClick={onDisplayDragAndDrop}
        >
          {ctx.t("search.upload")}
        </button>
      </div>
    </div>
  );
};

export default SwitchButton;
