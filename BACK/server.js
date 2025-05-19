const express = require("express");
// const http = require('http');
const WebSocket = require("ws");
const path = require("path");
const DeezerAPI = require("./DeezerAPI");

const app = express();
const server = app.listen(8080, () => {
  console.log("Server is listening on port 8080");
});
const wss = new WebSocket.Server({ server });

let rooms = {};

wss.on("connection", (ws) => {
  console.log("New websocket connection");

  ws.on("message", async (message) => {
    const messageStr = message.toString("utf8");
    console.log("Message received:", messageStr);
    try {
      const data = JSON.parse(messageStr);

      // Log the parsed data for debugging
      console.log("Parsed message data:", data);

      // Validate the message type
      if (!data.type) {
        sendError(ws, "Missing message type");
        return;
      }

      switch (data.type) {
        case "create_room":
          if (validateCreateRoomData(data)) {
            await handleCreateRoom(ws, data);
          } else {
            sendError(ws, "Invalid data for create_room");
          }
          break;

        case "join_room":
          if (validateJoinRoomData(data)) {
            await handleJoinRoom(ws, data);
          } else {
            sendError(ws, "Invalid data for join_room");
          }
          break;

        case "start_game":
          if (validateStartGameData(data)) {
            await handleStartGame(data);
          } else {
            sendError(ws, "Invalid data for start_game");
          }
          break;

        case "next_round":
          if (validateNextRoundData(data)) {
            await handleNextRound(data);
          } else {
            sendError(ws, "Invalid data for next_round");
          }
          break;

        case "submit_score":
          if (validateSubmitScoreData(data)) {
            handleSubmitScore(ws, data);
          } else {
            sendError(ws, "Invalid data for submit_score");
          }
          break;

        case "game_over":
          if (validateGameOverData(data)) {
            handleGameOver(data.roomId);
          } else {
            sendError(ws, "Invalid data for game_over");
          }
          break;

        default:
          sendError(ws, "Unknown message type");
          break;
      }
    } catch (error) {
      console.error("Error processing message:", error);
      sendError(ws, "Invalid message format");
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");
  });
});

// Validation functions
const validateCreateRoomData = (data) => {
  return typeof data.username === "string" && data.username.trim() !== "";
};

const validateJoinRoomData = (data) => {
  return (
    typeof data.roomId === "string" &&
    data.roomId.trim() !== "" &&
    typeof data.username === "string" &&
    data.username.trim() !== ""
  );
};

const validateStartGameData = (data) => {
  return typeof data.roomId === "string" && data.roomId.trim() !== "";
};

const validateNextRoundData = (data) => {
  return typeof data.roomId === "string" && data.roomId.trim() !== "";
};

const validateSubmitScoreData = (data) => {
  return (
    typeof data.roomId === "string" &&
    data.roomId.trim() !== "" &&
    typeof data.username === "string" &&
    data.username.trim() !== "" &&
    typeof data.points === "number"
  );
};

const validateGameOverData = (data) => {
  return typeof data.roomId === "string" && data.roomId.trim() !== "";
};

const handleCreateRoom = async (ws, data) => {
  const roomId = generateRoomId();
  console.log(`Creating room with ID ${roomId} for user ${data.username}`);

  try {
    // Utiliser la playlist par défaut
    const defaultPlaylistId = "7089916404";
    const playlist = await DeezerAPI.getPlaylistDetails(defaultPlaylistId);

    rooms[roomId] = {
      players: [{ ws, username: data.username, points: 0 }],
      gameStarted: false,
      scores: [],
      playlist: playlist,
      currentRound: 0,
      maxRounds: 10,
    };

    ws.send(JSON.stringify({ type: "room_created", roomId }));
    updateRoomPlayers(roomId);
  } catch (error) {
    console.error("Error creating room:", error);
    sendError(ws, "Failed to create room");
  }
};

const handleJoinRoom = async (ws, data) => {
  console.log(`User ${data.username} joining room ${data.roomId}`);
  const room = rooms[data.roomId];
  if (room) {
    room.players.push({ ws, username: data.username, points: 0 });
    ws.send(JSON.stringify({ type: "room_joined", roomId: data.roomId }));
    updateRoomPlayers(data.roomId);
  } else {
    sendError(ws, "Room not found");
  }
};

const handleStartGame = async (data) => {
  console.log(`Starting game in room ${data.roomId}`);
  const room = rooms[data.roomId];
  if (room && room.players.length > 0) {
    room.gameStarted = true;
    room.currentRound = 0;

    // D'abord envoyer game_started à tous les joueurs
    room.players.forEach((player) => {
      player.ws.send(JSON.stringify({ type: "game_started" }));
    });

    // Attendre un court instant pour s'assurer que les clients ont reçu game_started
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Ensuite envoyer la première chanson
    await sendNextTrack(room);
  } else {
    console.log(`Room not found or no players in room ${data.roomId}`);
    const player = room?.players.find((p) => p.ws === ws);
    if (player) {
      sendError(
        player.ws,
        "Impossible de démarrer le jeu : salon non trouvé ou pas assez de joueurs"
      );
    }
  }
};

const handleNextRound = async (data) => {
  const room = rooms[data.roomId];
  if (room) {
    room.currentRound++;
    if (room.currentRound >= room.maxRounds) {
      handleGameOver(data.roomId);
    } else {
      await sendNextTrack(room);
    }
  }
};

const sendNextTrack = async (room) => {
  try {
    const track = await DeezerAPI.getRandomTrackFromPlaylist(room.playlist.id);
    const trackInfo = {
      preview: track.preview,
      title: track.title,
      artist: track.artist.name,
      duration: track.duration,
    };

    room.players.forEach((player) => {
      player.ws.send(
        JSON.stringify({
          type: "new_track",
          track: trackInfo,
          round: room.currentRound + 1,
          maxRounds: room.maxRounds,
        })
      );
    });
  } catch (error) {
    console.error("Error sending next track:", error);
    room.players.forEach((player) => {
      sendError(player.ws, "Failed to get next track");
    });
  }
};

const handleSubmitScore = (ws, data) => {
  console.log(
    `Submitting score for user ${data.username} in room ${data.roomId}`
  );
  const room = rooms[data.roomId];
  if (!room) {
    console.log(`Room not found: ${data.roomId}`);
    sendError(ws, "Room not found");
    return;
  }

  const player = room.players.find((p) => p.username === data.username);
  if (!player) {
    console.log(`Player not found: ${data.username}`);
    sendError(ws, "Player not found");
    return;
  }

  player.points += data.points;

  // Mettre à jour le leaderboard avec tous les joueurs
  const leaderboard = room.players
    .map((player) => ({
      username: player.username,
      points: player.points,
    }))
    .sort((a, b) => b.points - a.points);

  // Envoyer le leaderboard mis à jour à tous les joueurs
  room.players.forEach((player) => {
    player.ws.send(JSON.stringify({ type: "leaderboard_update", leaderboard }));
  });
};

const updateRoomPlayers = (roomId) => {
  const room = rooms[roomId];
  if (room) {
    const players = room.players.map((player) => player.username);
    room.players.forEach((player) => {
      player.ws.send(JSON.stringify({ type: "room_update", players }));
    });
  }
};

const handleGameOver = (roomId) => {
  console.log(`Handling game over for room ${roomId}`);
  const room = rooms[roomId];
  if (room) {
    // Créer le leaderboard final avec tous les joueurs
    const finalLeaderboard = room.players
      .map((player) => ({
        username: player.username,
        points: player.points,
      }))
      .sort((a, b) => b.points - a.points);

    console.log("Final leaderboard:", finalLeaderboard);

    // Envoyer le leaderboard final à tous les joueurs
    room.players.forEach((player) => {
      player.ws.send(
        JSON.stringify({
          type: "leaderboard_update",
          leaderboard: finalLeaderboard,
        })
      );
      player.ws.send(JSON.stringify({ type: "game_over" }));
    });

    // Supprimer la salle après un court délai
    setTimeout(() => {
      delete rooms[roomId];
    }, 5000);
  }
};

const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 7);
};

const sendError = (ws, message) => {
  console.log("Sending error:", message);
  ws.send(JSON.stringify({ type: "error", message }));
};

const __DIRNAME = path.resolve();

app.use(express.static(path.join(__DIRNAME, "FRONT/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__DIRNAME, "FRONT", "dist", "index.html"));
});
