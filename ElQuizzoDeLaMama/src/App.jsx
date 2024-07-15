
import styles from "./App.module.scss";
import { Outlet } from "react-router-dom";

function App() {
  return (
    <div className={`d-flex mwFull mhFull  ${styles.appContainer}`}>
      
        <Outlet />
      

    </div>
  );
}
export default App;
