// LOGS SPOTIFY APP // TOKEN 

const clientId = '64633da727fe4789a47cf1fa1283f945'
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
    console.log('Token:', data.access_token);
    return data.access_token;
  } else {
    console.error('Error obtaining token:', response.statusText);
  }
};

// SHOW TOKEN
getSpotifyToken().then(token => {

  console.log('Received token:', token);
});

// GET PLAY LIST QUIZZ MUSICAL

export async function getPlaylistDetails(playlistId, token) {
    const playlist_url = `https://api.spotify.com/v1/playlists/${playlistId}`;
    const response = await fetch(playlist_url, {
        headers: {
            "Authorization " : `Bearer ${token}`
        }
})

if (response.ok) {
    const playlist = await response.json();
    console.log("Playlist details", playlist);
}else { 
    console.error("Error getting playlist details:", response.statusText);
 }
}

// TOKEN TO GET PLAYLIST 

getSpotifyToken().then(token => {
    if (token) {
      getPlaylistDetails('0EFdkYy5imXOa9hgaRozM3', token); // Utilisez l'ID de la playlist
    }
  });
  
