import { useState, useEffect, useContext, useRef } from "react";
import styles from "./Quizz.module.scss";
import { UserContext } from "../context/context";
import { WebSocketContext } from "../context/Websocket";
import { useNavigate } from "react-router-dom";

export default function Quiz() {
  const { username, roomId, setRoomId } = useContext(UserContext);
  const socket = useContext(WebSocketContext);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [songSeconds, setSongSeconds] = useState(25);
  const [prepSeconds, setPrepSeconds] = useState(5);
  const [round, setRound] = useState(1);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [points, setPoints] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPrepared, setIsPrepared] = useState(false);
  const [formError, setFormError] = useState("");
  const [wrongAnswer, setWrongAnswer] = useState(false);

  const audioRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Message received:", data);

        switch (data.type) {
          case "new_track":
            if (data.track && data.track.title && data.track.artist) {
              setCurrentTrack(data.track);
              setRound(data.round);
              setPrepSeconds(5);
              setSongSeconds(25);
              setAnswer("");
              setMessage("");
              setFormError("");
              setHasAnswered(false);
              setIsPlaying(false);
              setIsPrepared(false);
              setWrongAnswer(false);
            } else {
              console.error("Invalid track data received:", data.track);
              setMessage("Erreur : données de la piste invalides");
            }
            break;
          case "leaderboard_update":
            console.log("Received leaderboard update:", data.leaderboard);
            setLeaderboard(data.leaderboard);
            break;
          case "game_over":
            console.log("Game over received");
            setGameOver(true);
            break;
          case "error":
            setMessage(data.message);
            break;
        }
      };
    }
  }, [socket]);

  useEffect(() => {
    if (completedRounds === 10) {
      socket.send(
        JSON.stringify({
          type: "submit_score",
          roomId,
          username,
          points,
        })
      );
      setSongSeconds(0);
    }
  }, [completedRounds, points, roomId, username, socket]);

  // Timer de préparation
  useEffect(() => {
    if (prepSeconds > 0) {
      const countdown = setInterval(() => {
        setPrepSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else {
      setIsPrepared(true);
    }
  }, [prepSeconds]);

  // Démarrage de l'audio et du timer de la chanson après la préparation
  useEffect(() => {
    if (isPrepared && currentTrack && !isPlaying) {
      playAudio(currentTrack);
      setIsPlaying(true);
    }
  }, [isPrepared, currentTrack, isPlaying]);

  // Timer de la chanson
  useEffect(() => {
    if (isPrepared && songSeconds > 0 && !hasAnswered) {
      const countdown = setInterval(() => {
        setSongSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else if (songSeconds === 0 && !hasAnswered) {
      setHasAnswered(true);
      if (currentTrack) {
        setMessage(
          `Dommage, le temps est écoulé ! C'était <strong>${currentTrack.title}</strong> de <strong>${currentTrack.artist}</strong>`
        );
      } else {
        setMessage("Dommage, le temps est écoulé !");
      }

      // Arrêter l'audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      setTimeout(() => {
        setCompletedRounds((prevRounds) => prevRounds + 1);
        socket.send(JSON.stringify({ type: "next_round", roomId }));
      }, 2000);
    }
  }, [songSeconds, hasAnswered, isPrepared, currentTrack, roomId, socket]);

  const playAudio = (track) => {
    if (audioRef.current) {
      audioRef.current.src = track.preview;
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
        setMessage("Erreur lors de la lecture de l'audio");
      });
    }
  };

  const normalizeString = (str) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s\W]/g, "");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasAnswered) {
      if (answer.trim() === "") {
        setFormError("Veuillez entrer une réponse");
        return;
      }
      setFormError("");
      handleAnswerSubmission(answer);
    }
  };

  const handleAnswerSubmission = (submittedAnswer) => {
    if (currentTrack && !hasAnswered) {
      const normalizedAnswer = normalizeString(submittedAnswer);
      const normalizedTitle = normalizeString(currentTrack.title);
      const normalizedArtist = normalizeString(currentTrack.artist);

      if (
        normalizedAnswer === normalizedTitle ||
        normalizedAnswer === normalizedArtist
      ) {
        setHasAnswered(true);
        const pointsEarned = songSeconds * 7;
        setPoints((prevPoints) => prevPoints + pointsEarned);
        setMessage(
          `Félicitations ${username} ! ${pointsEarned} points pour Griffondor.`
        );
        setWrongAnswer(false);

        // Arrêter l'audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

        setTimeout(() => {
          setCompletedRounds((prevRounds) => prevRounds + 1);
          socket.send(JSON.stringify({ type: "next_round", roomId }));
        }, 2000);
      } else {
        setMessage("Retente ta chance !");
        setAnswer("");
      }
    }
  };

  const handleNewGame = () => {
    setCompletedRounds(0);
    setPoints(0);
    setLeaderboard([]);
    setGameOver(false);
    setRoomId("");
    navigate("/");
  };

  return (
    <div className={styles.Quiz}>
      <div className={styles.header}>
        <div className={styles.points}>
          <p>Points</p>
          <p>{points}</p>
        </div>
        <div className={styles.countdown}>
          <p>Temps</p>
          <p>{isPrepared ? songSeconds : prepSeconds}s</p>
        </div>
      </div>
      <div className={styles.quizzContainer}>
        <div className={styles.quizzForm}>
          {prepSeconds > 0 ? (
            <div className={styles.prep}>
              <p>Prépares-toi {username} !</p>
              <p>{prepSeconds}</p>
            </div>
          ) : gameOver ? (
            <div className={styles.gameOver}>
              <h4>Partie terminée !</h4>
              <h5>Classement final :</h5>
              <ul className={styles.leaderboard}>
                {leaderboard.map((player, index) => (
                  <li key={index} className={styles.leaderboardItem}>
                    <span className={styles.rank}>
                      #{index + 1} {""}
                    </span>
                    <span className={styles.username}>
                      {player.username} {""} - {""}
                    </span>
                    <span className={styles.score}>{player.points} points</span>
                  </li>
                ))}
              </ul>
              <button className="btn-primary" onClick={handleNewGame}>
                Nouvelle partie
              </button>
            </div>
          ) : (
            <div className={styles.game}>
              <div className={styles.round}>
                <p>Manche {round} </p>
              </div>
              <form onSubmit={handleSubmit}>
                <label htmlFor="answer">
                  Quel est le titre ou l'interprète de la chanson ?
                </label>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    setFormError("");
                  }}
                  disabled={hasAnswered || !isPrepared}
                  placeholder="Insérer votre réponse ici..."
                  className={styles.answerInput}
                />
                <div className="flex">
                  {formError && <p className={styles.formError}>{formError}</p>}
                </div>
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={hasAnswered || !isPrepared}
                >
                  Valider ma réponse
                </button>
              </form>
              {message && (
                <p
                  className={styles.message}
                  dangerouslySetInnerHTML={{ __html: message }}
                />
              )}
              {wrongAnswer && !message && (
                <p className={styles.wrongAnswer}>Retente ta chance !</p>
              )}
            </div>
          )}
        </div>
      </div>

      <audio ref={audioRef} />
    </div>
  );
}
