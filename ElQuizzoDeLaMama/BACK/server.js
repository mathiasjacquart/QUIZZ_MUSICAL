const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let rooms = {};

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'create_room':
        const roomId = generateRoomId();
        rooms[roomId] = { players: [{ ws, username: data.username }], gameStarted: false };
        ws.send(JSON.stringify({ type: 'room_created', roomId }));
        break;
      
      case 'join_room':
        if (rooms[data.roomId]) {
          rooms[data.roomId].players.push({ ws, username: data.username });
          ws.send(JSON.stringify({ type: 'room_joined', roomId: data.roomId }));
          broadcastRoomUpdate(data.roomId);
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
        }
        break;

      case 'start_game':
        if (rooms[data.roomId] && rooms[data.roomId].players.find(p => p.ws === ws)) {
          rooms[data.roomId].gameStarted = true;
          broadcastMessage(data.roomId, { type: 'game_started' });
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Cannot start game' }));
        }
        break;

      default:
        break;
    }
  });

  ws.on('close', () => {
    Object.keys(rooms).forEach((roomId) => {
      rooms[roomId].players = rooms[roomId].players.filter(player => player.ws !== ws);
      if (rooms[roomId].players.length === 0) {
        delete rooms[roomId];
      } else {
        broadcastRoomUpdate(roomId);
      }
    });
  });
});

const generateRoomId = () => {
  return Math.random().toString(36).substr(2, 9);
};

const broadcastMessage = (roomId, message) => {
  rooms[roomId].players.forEach(player => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  });
};

const broadcastRoomUpdate = (roomId) => {
  broadcastMessage(roomId, { type: 'room_update', players: rooms[roomId].players.map(p => p.username) });
};

server.listen(8080, () => {
  console.log('WebSocket server is listening on port 8080');
});
