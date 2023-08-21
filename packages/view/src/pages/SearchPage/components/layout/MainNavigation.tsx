import React, { useState } from "react";
import "./MainNavigation.scss";
import HistoryPage from "./HistoryPage";

interface MainNavigationProps { }

const MainNavigation: React.FC<MainNavigationProps> = () => {
  const [displayHistory, setDisplayHistory] = useState<boolean>(false);

  const displayHistoryHandler = () => {
    setDisplayHistory(!displayHistory);
  };

  return (
    <header className={"header"}>
      <ul>
        <li>
          {/* <button>English</button> */}
          <i className={"icon"}>E</i>
        </li>
        <li>
          {/* <button>Light Mode</button> */}
          <i className={"icon"}>L</i>
        </li>
        <li>
          {/* <button onClick={displayHistoryHandler}>History</button> */}
          <i className={"icon"} onClick={displayHistoryHandler}>H</i>
          {displayHistory && (
            <HistoryPage onDisplayHistory={displayHistoryHandler} />
          )}
        </li>
      </ul>
    </header>
  );
};

export default MainNavigation;
