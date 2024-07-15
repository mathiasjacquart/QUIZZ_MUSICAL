import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { Children } from "react";
import Begin  from "./pages/Begin"

export const router = createBrowserRouter ([
    {
        path:"/",
        element: <App/>,
        children: [
            {
                path:"/",
                element: <Begin/>
            }
        ]
    }
]);