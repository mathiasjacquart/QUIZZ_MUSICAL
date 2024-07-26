const express = require('express');
// const http = require('http');
const WebSocket = require('ws');
const path = require("path");

const app = express();
const server = app.listen(8080, () => {
  console.log('Server is listening on port 8080');
});
const wss = new WebSocket.Server({ server });

let rooms = {};

wss.on('connection', (ws) => {
  console.log("New websocket connection");

  ws.on('message', (message) => {
    const messageStr = message.toString('utf8');
    console.log('Message received:', messageStr);
    try {
      const data = JSON.parse(messageStr);

      // Log the parsed data for debugging
      console.log('Parsed message data:', data);

      // Validate the message type
      if (!data.type) {
        sendError(ws, 'Missing message type');
        return;
      }

      switch (data.type) {
        case 'create_room':
          if (validateCreateRoomData(data)) {
            handleCreateRoom(ws, data);
          } else {
            sendError(ws, 'Invalid data for create_room');
          }
          break;

        case 'join_room':
          if (validateJoinRoomData(data)) {
            handleJoinRoom(ws, data);
          } else {
            sendError(ws, 'Invalid data for join_room');
          }
          break;

        case 'start_game':
          if (validateStartGameData(data)) {
            handleStartGame(data);
          } else {
            sendError(ws, 'Invalid data for start_game');
          }
          break;

        case 'submit_score':
          if (validateSubmitScoreData(data)) {
            handleSubmitScore(ws, data);
          } else {
            sendError(ws, 'Invalid data for submit_score');
          }
          break;

        case 'game_over':
          if (validateGameOverData(data)) {
            handleGameOver(data.roomId);
          } else {
            sendError(ws, 'Invalid data for game_over');
          }
          break;

        default:
          sendError(ws, 'Unknown message type');
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
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

// Validation functions
const validateCreateRoomData = (data) => {
  return typeof data.username === 'string' && data.username.trim() !== '';
};

const validateJoinRoomData = (data) => {
  return typeof data.roomId === 'string' && data.roomId.trim() !== '' &&
         typeof data.username === 'string' && data.username.trim() !== '';
};

const validateStartGameData = (data) => {
  return typeof data.roomId === 'string' && data.roomId.trim() !== '';
};

const validateSubmitScoreData = (data) => {
  return typeof data.roomId === 'string' && data.roomId.trim() !== '' &&
         typeof data.username === 'string' && data.username.trim() !== '' &&
         typeof data.points === 'number';
};

const validateGameOverData = (data) => {
  return typeof data.roomId === 'string' && data.roomId.trim() !== '';
};

const handleCreateRoom = (ws, data) => {
  const roomId = generateRoomId();
  console.log(`Creating room with ID ${roomId} for user ${data.username}`);
  rooms[roomId] = { players: [{ ws, username: data.username, points: 0 }], gameStarted: false, scores: [] };
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
  } else {
    console.log(`Room not found or no players in room ${data.roomId}`);
  }
};

const handleSubmitScore = (ws, data) => {
  console.log(`Submitting score for user ${data.username} in room ${data.roomId}`);
  const room = rooms[data.roomId];
  if (!room) {
    console.log(`Room not found: ${data.roomId}`);
    sendError(ws, 'Room not found');
    return;
  }

  const player = room.players.find(p => p.username === data.username);
  if (!player) {
    console.log(`Player not found: ${data.username}`);
    sendError(ws, 'Player not found');
    return;
  }

  player.points += data.points;
  room.scores.push({ username: data.username, points: player.points });

  console.log(`Room scores after submission:`, room.scores);

  if (room.scores.length === room.players.length) {
    console.log(`Sending leaderboard for room ${data.roomId}`);
    room.scores.sort((a, b) => b.points - a.points);
    room.players.forEach(player => {
      player.ws.send(JSON.stringify({ type: 'leaderboard_update', leaderboard: room.scores }));
      player.ws.send(JSON.stringify({ type: 'game_over' }));
    });
    delete rooms[data.roomId];
    console.log(`Room ${data.roomId} deleted after game over.`);
  } else {
    console.log(`Waiting for more scores. Current scores: ${room.scores.length}/${room.players.length}`);
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
  console.log('Sending error:', message);
  ws.send(JSON.stringify({ type: 'error', message }));
};

const __DIRNAME = path.resolve();

app.use(express.static(path.join(__DIRNAME, "FRONT/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__DIRNAME, "FRONT", "dist", "index.html"));
});

