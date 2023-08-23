import React, { useState } from "react";
import "./MainNavigation.scss";
import HistoryPage from "./HistoryPage";
import useLanguage from "../../../../i18n/hooks/useLanguage";
import { useStore } from "../../../../contexts";

const MainNavigation = () => {
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
          <button
            className={`i-icon-park-outline-${
              t("mode.language") === "ENGLISH" ? "english" : "chinese"
            }`}
            onClick={toggleLanguage}
          />
        </li>
        <li>
          <button
            className={`i-ic-baseline-${theme}-mode`}
            onClick={toggleMode}
          />
        </li>
        <li>
          <button
            className="i-ic-baseline-history"
            onClick={displayHistoryHandler}
          />
          {displayHistory && (
            <HistoryPage onDisplayHistory={displayHistoryHandler} />
          )}
        </li>
      </ul>
    </header>
  );
};

export default MainNavigation;
