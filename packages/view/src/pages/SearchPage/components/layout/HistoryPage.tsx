import React, { useContext } from "react";
import "./HistoryPage.scss";
import MainPageContext from "../store/MainPageContext";
import { useNavigate } from "react-router-dom";
import { generateGraphWrapper } from "../../util/GenerateGraphWrapper";
import { useStore } from "@/contexts";

interface HistoryPageProps {
  onDisplayHistory: () => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onDisplayHistory }) => {
  const ctx = useContext(MainPageContext);
  const historyArr: string[] = ctx.history;
  const navigate = useNavigate();
  const setInfo = useStore((state) => state.setInfo);

  const loadHistoryHandler = (item: string) => {
    generateGraphWrapper(item);
    setInfo(item);
    navigate(`/analyze?q=${item}`);
  };

  return (
    <>
      <div className="panel">
        <div className={"panel-header"}>
          <div className={"header-content"}>
            <p className={"header-title"}>{ctx.t("search.history")}</p>
            <button
              className="i-ic-outline-delete-sweep"
              onClick={ctx.onClearHistory}
            />
          </div>
        </div>
        <div className={"history-panel"}>
          <ul>
            {historyArr.map((item) => (
              <li onClick={() => loadHistoryHandler(item)} key={item}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className={"overlay"} onClick={onDisplayHistory}></div>
    </>
  );
};

export default HistoryPage;
