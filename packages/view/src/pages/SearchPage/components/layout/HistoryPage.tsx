import React, { useContext } from "react";
import "./HistoryPage.scss";
import MainPageContext from "../store/MainPageContext";
import { useNavigate } from "react-router-dom";
import { generateGraphWrapper } from "../../util/GenerateGraphWrapper";

interface HistoryPageProps {
  onDisplayHistory: () => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onDisplayHistory }) => {
  const ctx = useContext(MainPageContext);
  const historyArr: string[] = ctx.history;
  const navigate = useNavigate();

  const loadHistoryHandler = (item: string) => {
    generateGraphWrapper(item);
    navigate("/analyze");
  };

  return (
    <>
      <div className="panel">
        <div className={'panelHeader'}>
          <div className={'headerContent'}>
            <p className={'headerTitle'}>History</p>
            <i onClick={ctx.onClearHistory} className={"icon"}>C</i>
          </div>
        </div>
        <div className={'historyPanel'}>
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
