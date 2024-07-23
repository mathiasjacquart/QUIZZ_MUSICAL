import { useState, useEffect } from 'react';
import { WebSocketContext } from '../context/Websocket';

export const WebSocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
  
    useEffect(() => {
      const newSocket = new WebSocket('https://quizz-musical.onrender.com');
      setSocket(newSocket);
  
      return () => newSocket.close(); 
    }, []);

    return (
        <WebSocketContext.Provider value={socket}>
        {children}
      </WebSocketContext.Provider>
    )}