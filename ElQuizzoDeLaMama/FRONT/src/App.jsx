
import styles from "./App.module.scss";
import { Outlet } from "react-router-dom";
import { UserProvider } from "./Providers/UserProvider"
import Background from "./components/Background";

function App() {
  return (
    <div className={`d-flex mwFull mhFull  ${styles.appContainer}`}>
       {/* <Background /> */}
      <UserProvider>
        <Outlet />
      </UserProvider>
      
       
      

    </div>
  );
}
export default App;
