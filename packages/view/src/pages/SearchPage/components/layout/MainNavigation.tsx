import React, { useState } from "react";
import classes from "./MainNavigation.module.css";
import HistoryPage from "./HistoryPage";

interface MainNavigationProps {}

const MainNavigation: React.FC<MainNavigationProps> = () => {
  const [displayHistory, setDisplayHistory] = useState<boolean>(false);

  const displayHistoryHandler = () => {
    setDisplayHistory(!displayHistory);
  };

  return (
    <header className={classes.header}>
      <ul>
        <li>
          <button>English</button>
        </li>
        <li>
          <button>Light Mode</button>
        </li>
        <li>
          <button onClick={displayHistoryHandler}>History</button>
          {displayHistory && (
            <HistoryPage onDisplayHistory={displayHistoryHandler} />
          )}
        </li>
      </ul>
    </header>
  );
};

export default MainNavigation;
