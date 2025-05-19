import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { Children } from "react";
import Begin from "./pages/Begin";
import Quiz from "./pages/Quizz";
import Lobby from "./pages/Lobby";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Begin />,
      },
      {
        path: "/quizz",
        element: <Quiz />,
      },
      {
        path: "/lobby",
        element: <Lobby />,
      },
    ],
  },
]);
