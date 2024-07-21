const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// const __DIRNAME = path.resolve();

let rooms = {};

wss.on('connection', (ws) => {
  console.log("New websocket connection");
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'create_room':
          handleCreateRoom(ws, data);
          break;

        case 'join_room':
          handleJoinRoom(ws, data);
          break;

        case 'start_game':
          handleStartGame(data);
          break;

        case 'submit_score':
          handleSubmitScore(ws, data);
          break;

        case 'game_over':
          handleGameOver(data.roomId);
          break;

        default:
          sendError(ws, 'Unknown message type');
          break;
      }
    } catch (error) {
      sendError(ws, 'Invalid message format');
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

const handleCreateRoom = (ws, data) => {
  const roomId = generateRoomId();
  console.log(`Creating room with ID ${roomId} for user ${data.username}`);
  rooms[roomId] = { players: [{ ws, username: data.username, points: 0 }], gameStarted: false, completedRounds: 0, scores: [] };
  ws.send(JSON.stringify({ type: 'room_created', roomId }));
  updateRoomPlayers(roomId);
};

const handleJoinRoom = (ws, data) => {
  console.log(`User ${data.username} joining room ${data.roomId}`);
  const room = rooms[data.roomId];
  if (room) {
    room.players.push({ ws, username: data.username, points: 0 });
    ws.send(JSON.stringify({ type: 'room_joined', roomId: data.roomId }));
    updateRoomPlayers(data.roomId);
  } else {
    sendError(ws, 'Room not found');
  }
};

const handleStartGame = (data) => {
  console.log(`Starting game in room ${data.roomId}`);
  const room = rooms[data.roomId];
  if (room && room.players.length > 0) {
    room.gameStarted = true;
    room.players.forEach(player => {
      player.ws.send(JSON.stringify({ type: 'game_started' }));
    });
  }
};

const handleSubmitScore = (ws, data) => {
  console.log(`Submitting score for user ${data.username} in room ${data.roomId}`);
  const room = rooms[data.roomId];
  if (room) {
    const player = room.players.find(p => p.username === data.username);
    if (player) {
      player.points += data.points;
      room.scores.push({ username: data.username, points: player.points });

      if (room.scores.length === room.players.length) {
        room.completedRounds++;
        if (room.completedRounds >= 10) {
          console.log(`Game over in room ${data.roomId}. Sending leaderboard.`);
          room.scores.sort((a, b) => b.points - a.points);
          room.players.forEach(player => {
            player.ws.send(JSON.stringify({ type: 'leaderboard_update', leaderboard: room.scores }));
            player.ws.send(JSON.stringify({ type: 'game_over' }));
          });
          delete rooms[data.roomId];
        } else {
          room.scores = [];
          room.players.forEach(player => {
            player.ws.send(JSON.stringify({ type: 'next_round' }));
          });
        }
      }
    } else {
      sendError(ws, 'Player not found');
    }
  } else {
    sendError(ws, 'Room not found or invalid game state');
  }
};

const updateRoomPlayers = (roomId) => {
  const room = rooms[roomId];
  if (room) {
    const players = room.players.map(player => player.username);
    room.players.forEach(player => {
      player.ws.send(JSON.stringify({ type: 'room_update', players }));
    });
  }
};

const handleGameOver = (roomId) => {
  console.log(`Handling game over for room ${roomId}`);
  const room = rooms[roomId];
  if (room) {
    room.players.forEach(player => {
      player.ws.send(JSON.stringify({ type: 'leaderboard_update', leaderboard: room.scores }));
      player.ws.send(JSON.stringify({ type: 'game_over' }));
    });
    delete rooms[roomId];
  }
};

const generateRoomId = () => {
  return Math.random().toString(36).substring(2, 7);
};

const sendError = (ws, message) => {
  ws.send(JSON.stringify({ type: 'error', message }));
};

// Serve static files from the "Game/dist" directory
// app.use(express.static(path.join(__DIRNAME, "Game/dist"))); 

// Serve the frontend's index.html for all other routes
// app.get("*", (req, res) => { 
//   res.sendFile(path.join(__DIRNAME, "FRONT", "dist", "index.html"));
// });

server.listen(8080, () => {
  console.log('Server is listening on port 8080');
});
