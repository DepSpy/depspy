import { Suspense, useEffect, useState, useContext } from "react";
import SearchSection from "./components/search/SearchSection";
import Header from "./components/layout/Header";
import DragAndDrop from "./components/search/DragAndDrop";
import Logo from "./components/search/Logo";
import LoadingPage from "./components/layout/LoadingPage";
import { MainPageContextProvider } from "./components/store/MainPageContext";
import fetchPackageNames from "./util/FetchPackageNames"

export default function SearchPage() {
  const [displayDragAndDrop, setDisplayDragAndDrop] = useState<boolean>(false);
  const displayDragAndDropHandler = () => {
    setDisplayDragAndDrop(true);
  };
  const hideDragAndDropHandler = () => {
    setDisplayDragAndDrop(false);
  };

  const [isLoadingNames, setIsLoadingNames] = useState<boolean>(true);
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    fetchPackageNames().then((packageNames) => {
      setNames(packageNames);
      setIsLoadingNames(false);
    });
  }, []);

  return (
    <MainPageContextProvider>
      <Suspense fallback={<LoadingPage />}>
        {isLoadingNames ? (
          <LoadingPage /> // Show loading page while fetching names
        ) : (
          <>
            <Header children={undefined} />
            <Logo children={undefined} />
            {!displayDragAndDrop && (
              <SearchSection
                names={names}
                onDisplayDragAndDrop={displayDragAndDropHandler}
              />
            )}
            {displayDragAndDrop && (
              <DragAndDrop
                onHideDragAndDrop={hideDragAndDropHandler}
              />
            )}
          </>
        )}
      </Suspense>
    </MainPageContextProvider>
  );;
}
