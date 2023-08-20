import React, { useEffect, useState } from "react";

const MainPageContext = React.createContext({
  collectedHistory: "vitest",
  history: [] as string[],
  onHistoryUpdate: (suggestion: string) => { },
  onClearHistory: () => { },
  onHistoryCollection: (suggestion: string) => { },
});

export const MainPageContextProvider = (props: any) => {
  const [history, setHistory] = useState<string[]>([]);
  const [collectedHistory, setcollectedHistory] = useState<string>("vitest");

  const historyCollectionHander = (suggestion: string) => {
    setcollectedHistory(suggestion);
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
        collectedHistory: collectedHistory,
        history: history,
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
