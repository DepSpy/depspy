import React, { useEffect, useState } from "react";
import useLanguage from "@/i18n/hooks/useLanguage";

const MainPageContext = React.createContext({
  info: "",
  history: [] as string[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  t: (preset: string) => "",
  toggleLanguage: () => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onHistoryUpdate: (suggestion: string) => {},
  onClearHistory: () => {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onHistoryCollection: (suggestion: string) => {},
});

export const MainPageContextProvider = (props) => {
  const [history, setHistory] = useState<string[]>([]);
  const [info, setInfo] = useState<string>("");
  const { t, toggleLanguage } = useLanguage();

  const historyCollectionHander = (suggestion: string) => {
    setInfo(suggestion);
  };

  const historyUpdateHandler = (suggestion: string) => {
    const updatedHistory = [
      suggestion,
      ...history.filter((item) => item !== suggestion),
    ];
    setHistory(updatedHistory);
    localStorage.setItem("suggestionHistory", JSON.stringify(updatedHistory));
  };

  useEffect(() => {
    const storedHistory = localStorage.getItem("suggestionHistory");
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, []);

  const clearHistoryHandler = () => {
    localStorage.removeItem("suggestionHistory");
    setHistory([]);
  };

  return (
    <MainPageContext.Provider
      value={{
        info: info,
        history: history,
        t: t,
        toggleLanguage: toggleLanguage,
        onHistoryUpdate: historyUpdateHandler,
        onClearHistory: clearHistoryHandler,
        onHistoryCollection: historyCollectionHander,
      }}
    >
      {props.children}
    </MainPageContext.Provider>
  );
};

export default MainPageContext;
