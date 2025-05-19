// Lobby.js
import React, { useState, useContext, useEffect } from "react";
import { UserContext } from "../context/context";
import { WebSocketContext } from "../context/Websocket";
import { useNavigate } from "react-router-dom";
import styles from "./Lobby.module.scss";

export default function Lobby() {
  const { username, roomId, setRoomId } = useContext(UserContext);
  const socket = useContext(WebSocketContext);
  const [disableBtn, setDisableBtn] = useState(false);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (socket) {
      // Gestion des erreurs de connexion
      socket.onerror = (error) => {
        console.error("Erreur WebSocket:", error);
        setError("Erreur de connexion au serveur");
        setDisableBtn(false);
      };

      // Gestion de la fermeture de connexion
      socket.onclose = () => {
        console.log("Connexion WebSocket fermée");
        setError("Connexion au serveur perdue");
        setDisableBtn(false);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Message reçu dans le Lobby:", data);

        switch (data.type) {
          case "room_created":
            console.log("Salle créée avec l'ID:", data.roomId);
            setRoomId(data.roomId);
            setDisableBtn(false);
            break;

          case "room_joined":
            console.log("Rejoint la salle:", data.roomId);
            setRoomId(data.roomId);
            setDisableBtn(false);
            break;

          case "room_update":
            console.log("Mise à jour des joueurs:", data.players);
            setPlayers(data.players);
            break;

          case "game_started":
            console.log("Le jeu démarre, redirection vers le quiz");
            setDisableBtn(false);
            navigate("/quizz");
            break;

          case "error":
            console.error("Erreur reçue:", data.message);
            setError(data.message);
            setDisableBtn(false);
            break;

          // Ignorer les autres types de messages
          default:
            break;
        }
      };
    }
  }, [navigate, setRoomId, socket]);

  const createRoom = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError("Pas de connexion au serveur");
      return;
    }
    console.log("Création d'une salle");
    setDisableBtn(true);
    setError("");
    socket.send(JSON.stringify({ type: "create_room", username }));
  };

  const joinRoom = (roomId) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError("Pas de connexion au serveur");
      return;
    }
    if (!roomId) {
      setError("Veuillez entrer un ID de salon");
      return;
    }
    console.log("Tentative de rejoindre la salle:", roomId);
    setDisableBtn(true);
    setError("");
    socket.send(JSON.stringify({ type: "join_room", roomId, username }));
  };

  const startGame = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setError("Pas de connexion au serveur");
      return;
    }
    if (roomId) {
      console.log("Démarrage du jeu dans la salle:", roomId);
      setDisableBtn(true);
      setError("");
      socket.send(JSON.stringify({ type: "start_game", roomId }));
    }
  };

  return (
    <div className={`${styles.Lobby}`}>
      <div className={`${styles.center}`}>
        <h1>Lobby</h1>
        {roomId ? (
          <>
            <h2>Salon ID: {roomId}</h2>
            <h3>Joueurs:</h3>
            <ul>
              {players.map((player, index) => (
                <li key={index}>{player}</li>
              ))}
            </ul>
            <button
              className="btn-primary"
              onClick={startGame}
              disabled={disableBtn}
            >
              {disableBtn ? "Démarrage..." : "Démarrer le jeu"}
            </button>
          </>
        ) : (
          <>
            <div className="d-flex flex-column align-items-center">
              <button
                className="btn-primary mb-3"
                disabled={disableBtn}
                onClick={createRoom}
              >
                {disableBtn ? "Création..." : "Créer un salon"}
              </button>
              <label htmlFor="roomId">
                Saisir l&apos;ID du salon pour rejoindre :
              </label>
              <input id="roomId" type="text" placeholder="Entrer ID du salon" />
              <button
                className="btn-primary"
                disabled={disableBtn}
                onClick={() =>
                  joinRoom(document.getElementById("roomId").value)
                }
              >
                {disableBtn ? "Connexion..." : "Rejoindre un salon"}
              </button>
            </div>
          </>
        )}
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
