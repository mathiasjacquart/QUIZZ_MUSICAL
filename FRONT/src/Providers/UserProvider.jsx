import { useState } from "react";
import { UserContext } from "../context/context";

export const UserProvider = ({ children }) => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState(''); 

  return (
    <UserContext.Provider value={{ username, setUsername, roomId, setRoomId }}>
      {children}
    </UserContext.Provider>
  );
};
