import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  createHashRouter,
} from "react-router-dom";
import AnalyzePage from "./pages/AnalyzePage";
import SearchPage from "./pages/SearchPage";
import { useStore } from "@/contexts";
import useLanguage from "./i18n/hooks/useLanguage";
import { useEffect } from "react";
import StaticAnalyzePage from "./pages/StaticAnalyzePage";
import { modeIndexMap,INJECT_MODE } from "../constant";

const routeElement = [
  { path: "search", element: <SearchPage /> },
  { path: "analyze", element: <AnalyzePage /> },
  { path: "static-analyze", element: <StaticAnalyzePage /> },
  {
    path: "*",
    element: (
      <Navigate
        to={
          modeIndexMap[import.meta.env.VITE_BUILD_MODE]
        }
      />
    ),
  },
];
function App() {
  const router = import.meta.env.VITE_BUILD_MODE === INJECT_MODE ? createHashRouter(routeElement): createBrowserRouter(routeElement);

  const theme = useStore((state) => state.theme);
  const { initLanguage } = useLanguage();

  window.addEventListener("storage", () => {
    useStore.setState({ theme: localStorage.getItem("theme") || "light" });
    initLanguage();
  });

  useEffect(() => {
    initLanguage();
  }, []);

  return (
    <div className="app" data-theme={theme}>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
