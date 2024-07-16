import React, { useState, useEffect, useContext, useRef } from 'react';
import styles from './Quizz.module.scss';
import { UserContext } from '../context/context';
import { getSpotifyToken, getPlaylistDetails } from '../../API/spotifyAPI';

export default function Quiz() {
  const { username } = useContext(UserContext);
  const [token, setToken] = useState(null);
  const [playlist, setPlaylist] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [songSeconds, setSongSeconds] = useState(30); // Délai pour chaque chanson
  const [prepSeconds, setPrepSeconds] = useState(5); // Délai de préparation entre les manches
  const [round, setRound] = useState(1);
  const [answer, setAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [completedRounds, setCompletedRounds] = useState(0); // Compteur pour le nombre de manches complétées
  const [points, setPoints] = useState(0); // État pour les points
  const audioRef = useRef(null);
  const [isAutoplayAllowed, setIsAutoplayAllowed] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = await getSpotifyToken();
      setToken(token);
      if (token) {
        const playlist = await getPlaylistDetails('0EFdkYy5imXOa9hgaRozM3', token);
        setPlaylist(playlist);
        setCurrentTrack(getRandomTrack(playlist.tracks.items));
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (songSeconds > 0) {
      const countdown = setInterval(() => {
        setSongSeconds(prevSeconds => prevSeconds - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else {
      setTimeout(() => {
        setCompletedRounds(prevRounds => prevRounds + 1);
      }, 2000);
    }
  }, [songSeconds]);

  useEffect(() => {
    if (prepSeconds > 0) {
      const countdown = setInterval(() => {
        setPrepSeconds(prevSeconds => prevSeconds - 1);
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [prepSeconds]);

  useEffect(() => {
    if (completedRounds > 0 && completedRounds <= 10) {
      startNextRound();
    }
  }, [completedRounds]);

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      playAudio(currentTrack);
    }
  }, [currentTrack]);

  const getRandomTrack = (tracks) => {
    const randomIndex = Math.floor(Math.random() * tracks.length);
    return tracks[randomIndex].track;
  };

  const normalizeString = (str) => {
    return str.toLowerCase().replace(/[\s\W]/g, '');
  };

  const playAudio = (track) => {
    if (audioRef.current) {
      audioRef.current.src = track.preview_url;
      audioRef.current
        .play()
        .then(() => setIsAutoplayAllowed(true))
        .catch(error => {
          console.error('Autoplay was prevented:', error);
          setIsAutoplayAllowed(false);
          setCurrentTrack(getRandomTrack(playlist.tracks.items)); // Sélectionner une nouvelle chanson aléatoire
        });
    }
  };

  const startNextRound = async () => {
    setPrepSeconds(5);
    setSongSeconds(30);

    if (playlist) {
      setCurrentTrack(getRandomTrack(playlist.tracks.items));
      setRound(prevRound => prevRound + 1);
      setAnswer('');
      setMessage('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentTrack) {
      const normalizedAnswer = normalizeString(answer);
      const normalizedTitle = normalizeString(currentTrack.name);
      const normalizedArtist = normalizeString(currentTrack.artists[0].name);

      if (normalizedAnswer === normalizedTitle || normalizedAnswer === normalizedArtist) {
        const pointsEarned = songSeconds * 10;
        setPoints(prevPoints => prevPoints + pointsEarned);
        setMessage(`T'es trop fort ${username} ! ${pointsEarned} points pour Griffondor.`);
        setTimeout(() => {
          setCompletedRounds(prevRounds => prevRounds + 1);
        }, 2000);
      } else {
        setMessage(`T'as de la merde dans les oreilles ou quoi ${username}, c'était ${currentTrack.name} par ${currentTrack.artists[0].name}`);
        setTimeout(() => {
          setCompletedRounds(prevRounds => prevRounds + 1);
        }, 2000);
      }
    } else if (answer === "") {
      setTimeout(() => {
        setCompletedRounds(prevRounds => prevRounds + 1);
      }, 2000);
    }
  };

  return (
    <div className={styles.Quiz}>
      <div className={styles.center}>
        <p>Manche {round}</p>
        <p>Points: {points}</p>
        {prepSeconds > 0 ? (
          <>
            <p>Préparez-vous: {prepSeconds}</p>
          </>
        ) : (
          <>
            {songSeconds > 0 ? (
              <>
                <p>Temps restant: {songSeconds}</p>
                {currentTrack && (
                  <div>
                    <p>Écoutez la chanson:</p>
                    <audio ref={audioRef} autoPlay={isAutoplayAllowed}>
                      <source src={currentTrack.preview_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Entrez l'artiste ou le titre"
                  />
                  <button type="submit">Submit</button>
                </form>
                {message && <p>{message}</p>}
              </>
            ) : (
              <>
                {completedRounds < 10 ? (
                  <p>Manche suivante dans quelques secondes...</p>
                ) : (
                  <p>Quiz terminé! Vous avez accumulé un total de {points} points.</p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
