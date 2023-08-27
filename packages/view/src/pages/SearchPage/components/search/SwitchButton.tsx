import React, { useContext } from "react";
import "./SwitchButton.scss";
import MainPageContext from "../store/MainPageContext";
import { useNavigate } from "react-router-dom";
import { generateGraphWrapper } from "../../util/GenerateGraphWrapper";
import { useStore } from "@/contexts";
import fetchPackageNames from "../../util/FetchPackageNames";

interface SwitchProps {
  onDisplayDragAndDrop: () => void;
  newValue: string;
}

const SwitchButton: React.FC<SwitchProps> = ({
  onDisplayDragAndDrop,
  newValue,
}) => {
  const navigate = useNavigate();
  const ctx = useContext(MainPageContext);
  const setInfo = useStore((state) => state.setInfo);

  const findDependencyHandler = async () => {
    const trimmedInputValue = newValue.trim().toLowerCase();
    if (trimmedInputValue === "") {
      console.log("Can't search empty dependency");
      return;
    }
    const pendingDependency = await fetchPackageNames(trimmedInputValue);
    if (pendingDependency.length !== 0) {
      setInfo(trimmedInputValue);
      ctx.onHistoryUpdate(trimmedInputValue);
      generateGraphWrapper(trimmedInputValue);
      navigate(`/analyze?q=${trimmedInputValue}`);
    } else {
      console.log("Non-exist dependency, please search another one.");
      return;
    }
  };

  return (
    <div className={"button-area"}>
      <div className={"button-container"}>
        <button
          className={"button-large-important"}
          onClick={findDependencyHandler}
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
