import { useState, useContext } from "react";
import "./MainNavigation.scss";
import HistoryPage from "./HistoryPage";
import { useStore } from "../../../../contexts";
import MainPageContext from "../store/MainPageContext";

const MainNavigation = () => {
  const [displayHistory, setDisplayHistory] = useState<boolean>(false);
  const ctx = useContext(MainPageContext);
  const language = ctx.t("mode.language") as string;

  const displayHistoryHandler = () => {
    setDisplayHistory(!displayHistory);
  };

  const { theme, setTheme } = useStore();
  const toggleMode = () => {
    setTheme(theme);
  };

  return (
    <header className={"header"}>
      <ul>
        <li>
          <button
            className="i-carbon-logo-github text-icon h-24px w-24px hover:text-icon-hover m-2"
            onClick={() => {
              window.open("https://github.com/DepSpy/depspy", "_blank");
            }}
          />
        </li>
        <li>
          <button
            className={`i-icon-park-outline-${
              language === "ENGLISH" ? "english" : "chinese"
            }`}
            onClick={ctx.toggleLanguage}
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
