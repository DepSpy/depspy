import React, { useContext } from "react";
import classes from "./HistoryPage.module.css";
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
      <div className={classes.historyPanel}>
        <ul>
          {historyArr.map((item) => (
            <li onClick={() => loadHistoryHandler(item)} key={item}>
              {item}
            </li>
          ))}
        </ul>
        <div className={classes.buttonContainer}>
          <button onClick={ctx.onClearHistory}>Clear History</button>
        </div>
      </div>
      <div className={classes.overlay} onClick={onDisplayHistory}></div>
    </>
  );
};

export default HistoryPage;
