import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import AnalyzePage from "./pages/AnalyzePage";
import { isStatic } from "./utils/isStatic";

function App() {
  const routeElement = [
    { path: "search", element: <SearchPage /> },
    { path: "analyze", element: <AnalyzePage /> },
    { path: "*", element: <Navigate to={isStatic ? "/search" : "/analyze"} /> },
  ];

  const router = createBrowserRouter(routeElement);
  return <RouterProvider router={router} />;
}

export default App;
