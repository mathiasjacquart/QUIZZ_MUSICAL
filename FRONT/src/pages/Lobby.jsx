import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../context/context';
import { useNavigate } from "react-router-dom";
import styles from "./Lobby.module.scss";

// const socket = new WebSocket('ws://localhost:8080');
const socket = new WebSocket('https://quizz-musical.onrender.com');


export default function Lobby() {
  const { username, roomId, setRoomId } = useContext(UserContext); // Ajout de roomId et setRoomId
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'room_created':
          setRoomId(data.roomId);
          break;
        case 'room_joined':
          setRoomId(data.roomId);
          break;
        case 'room_update':
          setPlayers(data.players);
          break;
        case 'game_started':
          navigate('/countdown');
          break;
        case 'error':
          setError(data.error);
          break;
        default:
          break;
      }
    };
  }, [navigate, setRoomId]);

  const createRoom = () => {
    socket.send(JSON.stringify({ type: 'create_room', username }));
  };

  const joinRoom = (roomId) => {
    socket.send(JSON.stringify({ type: 'join_room', roomId, username }));
  };

  const startGame = () => {
    if (roomId) {
      socket.send(JSON.stringify({ type: 'start_game', roomId }));
    }
  };

  return (
    <div className={`${styles.Lobby}`}>
      <div className={`${styles.center}`}>
        <h1> Lobby</h1>
        {roomId ? (
          <>
            <h2>Salon ID: {roomId}</h2>
            <h3>Joueurs:</h3>
            <ul>
              {players.map((player, index) => (
                <li key={index}>{player}</li>
              ))}
            </ul>
            <button className='btn-primary' onClick={startGame}>Démarrer le jeu</button>
          </>
        ) : (
          <>
            <div className='d-flex flex-column align-items-center'>
              <button className='btn-primary' onClick={createRoom}>Créer un salon</button>
              <label htmlFor="roomId">Saisir l'ID du salon pour rejoindre :</label>
              <input id="roomId" type="text" placeholder="Entrer ID du salon" />
              <button className='btn-primary' onClick={() => joinRoom(document.getElementById('roomId').value)}>Rejoindre un salon</button>
            </div>
          </>
        )}
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
