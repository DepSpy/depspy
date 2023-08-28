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
});

export const MainPageContextProvider = (props) => {
  const [history, setHistory] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [info, setInfo] = useState<string>("");
  const { t, toggleLanguage } = useLanguage();

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
      }}
    >
      {props.children}
    </MainPageContext.Provider>
  );
};

export default MainPageContext;
