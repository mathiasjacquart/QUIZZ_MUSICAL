import { useState } from "react";
import { UserContext } from "../context/context";
export const UserProvider = ({ children }) => {
    const [username, setUsername] = useState('');
  
    return (
      <UserContext.Provider value={{ username, setUsername }}>
        {children}
      </UserContext.Provider>
    );
  };
  