import React, { useState } from "react";
import "./MainNavigation.scss";
import HistoryPage from "./HistoryPage";
import useLanguage from "../../../../i18n/hooks/useLanguage";
import { useStore } from "../../../../contexts";

interface MainNavigationProps {}

const MainNavigation: React.FC<MainNavigationProps> = () => {
  const [displayHistory, setDisplayHistory] = useState<boolean>(false);

  const displayHistoryHandler = () => {
    setDisplayHistory(!displayHistory);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t, toggleLanguage } = useLanguage();
  const { theme, setTheme } = useStore();
  const toggleMode = () => {
    setTheme(theme);
  };

  return (
    <header className={"header"}>
      <ul>
        <li>
          {/* <button>English</button> */}
          <i onClick={toggleLanguage} className={"icon"}>
            E
          </i>
        </li>
        <li>
          {/* <button>Light Mode</button> */}
          <i onClick={toggleMode} className={"icon"}>
            L
          </i>
        </li>
        <li>
          {/* <button onClick={displayHistoryHandler}>History</button> */}
          <i className={"icon"} onClick={displayHistoryHandler}>
            H
          </i>
          {displayHistory && (
            <HistoryPage onDisplayHistory={displayHistoryHandler} />
          )}
        </li>
      </ul>
    </header>
  );
};

export default MainNavigation;
