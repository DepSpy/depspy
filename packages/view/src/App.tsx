import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import AnalyzePage from "./pages/AnalyzePage";
import SearchPage from "./pages/SearchPage";
import { useStore } from "@/contexts";
import useLanguage from "./i18n/hooks/useLanguage";
import { useEffect } from "react";
import StaticAnalyzePage from "./pages/StaticAnalyzePage";

const routeElement = [
  { path: "search", element: <SearchPage /> },
  { path: "analyze", element: <AnalyzePage /> },
  { path: "/static-analyze", element: <StaticAnalyzePage /> },
  {
    path: "*",
    element: (
      <Navigate
        to={
          import.meta.env.VITE_BUILD_MODE == "online"
            ? "/search"
            : "/analyze?depth=3"
        }
      />
    ),
  },
];
function App() {
  const router = createBrowserRouter(routeElement);

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
