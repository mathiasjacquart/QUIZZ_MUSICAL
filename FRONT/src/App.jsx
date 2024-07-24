
import styles from "./App.module.scss";
import { Outlet } from "react-router-dom";
import { UserProvider } from "./Providers/UserProvider"
import { WebSocketProvider } from "./Providers/WebSocketProvider";

function App() {
  return (
    <div className={`d-flex mwFull mhFull  ${styles.appContainer}`}>
      <WebSocketProvider>
      <UserProvider>
        <Outlet />
      </UserProvider>
      </WebSocketProvider>

    </div>
  );
}
export default App;
