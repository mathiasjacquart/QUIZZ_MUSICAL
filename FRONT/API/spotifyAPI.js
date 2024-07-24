//LOGS 

const clientId = '64633da727fe4789a47cf1fa1283f945';
const clientSecret = 'd458b9922c894cf393470852f0b62b94';


//TOKEN SPOTIFY
export const getSpotifyToken = async () => {
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
// PLAYLIST SPOTIFY
export const getPlaylistDetails = async (playlistId, token) => {
  const playlist_url = `https://api.spotify.com/v1/playlists/${playlistId}`;
  const response = await fetch(playlist_url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (response.ok) {
    const playlist = await response.json();
    // FILTRE LES PREVIEWS_URL NULLES POUR OBTENIR DES URLS FONCTIONNABLES
    playlist.tracks.items = playlist.tracks.items.filter(item => item.track.preview_url);
    return playlist;
  } else {
    console.error('Error getting playlist details:', response.statusText);
  }
};
