import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { Children } from "react";
import Begin  from "./pages/Begin"
import Timer from "./components/Timer";
import Quiz from "./pages/Quizz";

export const router = createBrowserRouter ([
    {
        path:"/",
        element: <App/>,
        children: [
            {
                path:"/",
                element: <Begin/>
            },
            {
                path:"/countdown",
                element: <Timer/>
            }, 
            {
                path:"/quizz", 
                element:<Quiz/>
            }
        ]
    }
]);