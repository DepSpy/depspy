import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import AnalyzePage from "./pages/AnalyzePage";
import { isStatic } from "./utils/isStatic";
import { useStore } from "./contexts";

function App() {
  const routeElement = [
    { path: "search", element: <SearchPage /> },
    { path: "analyze", element: <AnalyzePage /> },
    { path: "*", element: <Navigate to={isStatic ? "/search" : "/analyze"} /> },
  ];

  const router = createBrowserRouter(routeElement);
  const theme = useStore((state) => state.theme);

  return (
    <div className="app" data-theme={theme}>
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
