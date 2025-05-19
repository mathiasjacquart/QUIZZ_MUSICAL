const axios = require("axios");

class DeezerAPI {
  constructor() {
    this.baseURL = "https://api.deezer.com";
  }

  /**
   * Récupère les détails d'une playlist Deezer
   * @param {string} playlistId - L'ID de la playlist
   * @returns {Promise<Object>} - Détails de la playlist avec les chansons
   */
  async getPlaylistDetails(playlistId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/playlist/${playlistId}`
      );
      const playlist = response.data;

      // Filtrer les chansons qui ont un extrait audio
      playlist.tracks.data = playlist.tracks.data.filter(
        (track) => track.preview
      );

      return playlist;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des détails de la playlist:",
        error
      );
      throw error;
    }
  }

  /**
   * Récupère une chanson aléatoire d'une playlist
   * @param {string} playlistId - L'ID de la playlist
   * @returns {Promise<Object>} - Informations de la chanson
   */
  async getRandomTrackFromPlaylist(playlistId) {
    try {
      const playlist = await this.getPlaylistDetails(playlistId);
      const tracks = playlist.tracks.data;

      if (tracks.length === 0) {
        throw new Error("Aucune chanson disponible dans la playlist");
      }

      const randomIndex = Math.floor(Math.random() * tracks.length);
      return tracks[randomIndex];
    } catch (error) {
      console.error(
        "Erreur lors de la récupération d'une chanson aléatoire:",
        error
      );
      throw error;
    }
  }
}

module.exports = new DeezerAPI();
