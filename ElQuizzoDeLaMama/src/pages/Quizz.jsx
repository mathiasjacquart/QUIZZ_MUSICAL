import React, { useState, useEffect, useContext } from 'react';
import styles from './Quizz.module.scss';
import { UserContext } from '../context/context';

const clientId = '64633da727fe4789a47cf1fa1283f945';
const clientSecret = 'd458b9922c894cf393470852f0b62b94';

const getSpotifyToken = async () => {
  const url = 'https://accounts.spotify.com/api/token';
  const body = 'grant_type=client_credentials';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
    },
    body: body
  });

  if (response.ok) {
    const data = await response.json();
    return data.access_token;
  } else {
    console.error('Error obtaining token:', response.statusText);
  }
};

const getPlaylistDetails = async (playlistId, token) => {
  const playlist_url = `https://api.spotify.com/v1/playlists/${playlistId}`;
  const response = await fetch(playlist_url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.ok) {
    const playlist = await response.json();
    return playlist;
  } else {
    console.error('Error getting playlist details:', response.statusText);
  }
};

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

  useEffect(() => {
    const fetchData = async () => {
      const token = await getSpotifyToken();
      setToken(token);
      if (token) {
        const playlist = await getPlaylistDetails('0EFdkYy5imXOa9hgaRozM3', token); // Utilisez l'ID de la playlist
        setPlaylist(playlist);
        setCurrentTrack(getRandomTrack(playlist.tracks.items)); // Sélectionner une chanson aléatoire au début
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
            setCompletedRounds(prevRound => prevRound+1)
        },2000)
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

  const getRandomTrack = (tracks) => {
    const randomIndex = Math.floor(Math.random() * tracks.length);
    return tracks[randomIndex].track;
  };

  const normalizeString = (str) => {
    return str.toLowerCase().replace(/[\s\W]/g, '');
  };

  const startNextRound = async () => {
    setPrepSeconds(5); // Réinitialiser le délai de préparation
    setSongSeconds(30); // Réinitialiser le délai pour chaque chanson

    if (playlist) {
      setCurrentTrack(getRandomTrack(playlist.tracks.items)); // Sélectionner une nouvelle chanson aléatoire
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
        setMessage('Correct!');
        setTimeout(() => {
          setCompletedRounds(prevRounds => prevRounds + 1);
        }, 2000); // Attendre 2 secondes avant de passer à la manche suivante
      } else {
        setMessage(`Faux, c'était ${currentTrack.name} par ${currentTrack.artists[0].name}`);
        setTimeout(() => {
            setCompletedRounds(prevRounds => prevRounds + 1);
          }, 2000); // Attendre 2 secondes avant de passer à la manche suivante
      }
    } else if (answer ==="") { 
        setTimeout(() => {
            setCompletedRounds(prevRounds => prevRounds + 1);
          }, 2000);
    }
  };

  return (
    <div className={styles.Quiz}>
      <div className={styles.center}>
        <p>Manche {round}</p>
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
                    <audio controls autoPlay>
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
                  <p>Quiz terminé!</p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
