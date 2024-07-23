import React, { useState, useEffect, useContext, useRef } from 'react';
import styles from './Quizz.module.scss';
import { UserContext } from '../context/context';
import { WebSocketContext } from "../context/Websocket";
import { getSpotifyToken, getPlaylistDetails } from '../../API/spotifyAPI';
import { useNavigate } from 'react-router-dom';

export default function Quiz() {
  const { username, roomId, setRoomId } = useContext(UserContext);
  const socket = useContext(WebSocketContext);
  const [token, setToken] = useState(null);
  const [playlist, setPlaylist] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [songSeconds, setSongSeconds] = useState(20);
  const [prepSeconds, setPrepSeconds] = useState(5);
  const [round, setRound] = useState(1);
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [completedRounds, setCompletedRounds] = useState(0);
  const [points, setPoints] = useState(0);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false)
  const [gameOver, setGameOver] = useState(false);

  const audioRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = await getSpotifyToken();
      setToken(token);
      if (token) {
        const playlist = await getPlaylistDetails('2GPzX5QjVqGAgXYxPHEtGW', token);
        setPlaylist(playlist);
        setCurrentTrack(getValidTrack(playlist.tracks.items));
      }
    };
    fetchData();
  }, []);
    console.log(playlist);
  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Message received:', data);
        if (data.type === 'leaderboard_update') {
          setLeaderboard(data.leaderboard);
        } else if (data.type === 'game_over') {
          setGameOver(true);
        } else if (data.type === 'next_round') {
          startNextRound();
        }
      };
    }
  }, [socket]);

  useEffect(() => {
    if (completedRounds === 10) {
       console.log('Sending score to server:', { type: 'submit_score', roomId, username, points });
      socket.send(JSON.stringify({ type: 'submit_score', roomId, username, points }));
      setSongSeconds(0)
      setLoading(true)

    }
  }, [completedRounds, points, roomId, username, socket]);

  useEffect(() => {
    if (prepSeconds===0 && songSeconds > 0) {
      const countdown = setInterval(() => {
        setSongSeconds(prevSeconds => prevSeconds - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else {
      handleAnswerSubmission('');
    }
  }, [songSeconds, prepSeconds]);

  useEffect(() => {
    if (prepSeconds > 0) {
      const countdown = setInterval(() => {
        setPrepSeconds(prevSeconds => prevSeconds - 1);
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [prepSeconds]);

  useEffect(() => {
    if (completedRounds > 0 && completedRounds < 10) {
      startNextRound();
    }
  }, [completedRounds]);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      playAudio(currentTrack);
    }
  }, [currentTrack]);

  const playAudio = (track) => {
    if (audioRef.current) {
      audioRef.current.src = track.preview_url;
      audioRef.current.play().catch(() => {
        setCurrentTrack(getValidTrack(playlist.tracks.items));
      });
    }
  };

  const getValidTrack = (tracks) => {
    let validTrack = null;
    const shuffledTracks = shuffleArray(tracks);
    for (const trackItem of shuffledTracks) {
      const track = trackItem.track;
      if (track.preview_url) {
        validTrack = track;
        break;
      }
    }
    return validTrack;
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const normalizeString = (str) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') 
      .replace(/[\s\W]/g, '');
  };

  const startNextRound = () => {
    setPrepSeconds(5);
    setSongSeconds(20);
    if (playlist) {
      setCurrentTrack(getValidTrack(playlist.tracks.items));
      setAnswer('');
      setMessage('');
      setRound(prevRound => prevRound + 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (completedRounds < 10) { 
      handleAnswerSubmission(answer);
    } else { 
      handleAnswerSubmission(answer)
     
    }
   
  };

  const handleAnswerSubmission = (answer) => {
    if (currentTrack) {
      const normalizedAnswer = normalizeString(answer);
      const normalizedTitle = normalizeString(currentTrack.name);
      const normalizedArtist = normalizeString(currentTrack.artists[0].name);

      if (normalizedAnswer === normalizedTitle || normalizedAnswer === normalizedArtist) {
        const pointsEarned = songSeconds * 7;
        setPointsAwarded(true);
        setPoints(prevPoints => prevPoints + pointsEarned);
        setMessage(`T'es trop fort ${username} ! ${pointsEarned} points pour Griffondor.`);
      } else {
        setMessage(`Eh non ${username} ! C'était ${currentTrack.name} de ${currentTrack.artists[0].name}`);
      }

      setTimeout(() => {
        setCompletedRounds(prevRounds => prevRounds + 1);
      }, 2000);
    } else {
      setMessage(`Il fallait te dépêcher ${username}, c'était ${currentTrack.name} de ${currentTrack.artists[0].name}`);
      setTimeout(() => {
        setCompletedRounds(prevRounds => prevRounds + 1);
      }, 2000);
    }
  };

  const handleNewGame = () => {
    setCompletedRounds(0);
    setPoints(0);
    setPointsAwarded(false);
    setLeaderboard([]);
    setGameOver(false);
    setRoomId("")
    navigate('/');
  };

  return (
    <div className={styles.Quiz}>
 
      <div className={styles.points}>
        <div className='d-flex flex-column center'>
          <p>Points</p>
          <p>{points}</p>
        </div>
      </div>
      <div className={styles.center}>
        {prepSeconds > 0 ? (
          <div className={styles.prep}>
            <p >Prépares-toi {username} !</p>
            <p>{prepSeconds}</p>
          </div>
        ) : (
          <>
            {songSeconds > 0 ? (
              <>

                <div className={styles.countdown}>
                    <p>{songSeconds}</p>
                </div> 

                                  {currentTrack && (
                                    <div>
                                      <div className={styles.manche}>
                                        <p>Manche {round}</p>
                                      </div>
                                      <div>
                                        <audio ref={audioRef} autoPlay>
                                          <source src={currentTrack.preview_url} type="audio/mpeg" />
                                        </audio>
                                      </div>
                                    </div>
                                  )}
                                  <form onSubmit={handleSubmit}>
                                    <label htmlFor="Answer">Saisissez l'artiste ou le titre de la chanson :</label>
                                    <input
                                      autoFocus
                                      type="text"
                                      value={answer}
                                      onChange={(e) => setAnswer(e.target.value)}
                                      placeholder="Entrez l'artiste ou le titre"
                                    />
                                    <button className='btn-primary' type="submit">Envoyer</button>
                                  </form>
                                  <div className={styles.message}>{message && <p>{message}</p>}</div>                
                </>
            ) : (
              <>
                {completedRounds < 10 ? (
                  <p className={styles.nextRound}>Manche suivante dans quelques secondes...</p>
                ) : (
                  <>
                    {gameOver ? (
                      <div>
                         {gameOver && (
                          <div className={styles.leaderboard}>
                            <h3>Classement Final</h3>
                            <ol >
                              {leaderboard.map((player, index) => (
                                <li  className={styles.scores} key={index}> {player.username}: {player.points} points</li>
                              ))}
                            </ol>
                            <button onClick={handleNewGame} className="btn-primary">Nouvelle Partie</button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                      <svg className={styles.loading} viewBox="25 25 50 50">
                      <circle r="20" cy="50" cx="50"></circle>
                    </svg>
                    <p className={styles.loadingText}>En attente des scores des autres joueurs...</p>
                      </div>

                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
