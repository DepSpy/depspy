import React, { useContext } from "react";
import "./SwitchButton.scss";
import MainPageContext from "../store/MainPageContext";
import { useNavigate } from "react-router-dom";
import { generateGraphWrapper } from "../../util/GenerateGraphWrapper";

interface SwitchProps {
  onDisplayDragAndDrop: () => void;
}

const SwitchButton: React.FC<SwitchProps> = ({ onDisplayDragAndDrop }) => {
  const navigate = useNavigate();
  const ctx = useContext(MainPageContext);
  const info = ctx.info;

  const addHistoryHandler = () => {
    if (info.length > 0) {
      console.log("search name is:", info);
      ctx.onHistoryUpdate(info);
      generateGraphWrapper(info);
      navigate("/analyze", {
        state: {
          searchname: info,
          json: "",
        },
      });
    }
  };

  return (
    <div className={"button-area"}>
      <div className={"button-container"}>
        <button
          className={"button-large-important"}
          onClick={addHistoryHandler}
        >
          Find Package
        </button>
        <button
          className={"button-large-default"}
          onClick={onDisplayDragAndDrop}
        >
          Upload package.json File
        </button>
      </div>
    </div>
  );
};

export default SwitchButton;
