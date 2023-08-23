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
  const collectedHistory = ctx.collectedHistory;
  const setInfo = useStore((state) => state.setInfo);
  const addHistoryHandler = () => {
    if (collectedHistory.length > 0) {
      ctx.onHistoryUpdate(collectedHistory);
      generateGraphWrapper(collectedHistory);
      navigate(`/analyze?q=${collectedHistory}`);
      setInfo(collectedHistory);
    }
  };

  return (
    <div className={"button-area"}>
      <div className={"button-container"}>
        <button className={"button"} onClick={addHistoryHandler}>
          Find Package
        </button>
        <button className={"button"} onClick={onDisplayDragAndDrop}>
          Upload package.json File
        </button>
      </div>
    </div>
  );
};

export default SwitchButton;
