const express = require('express');
const logger = require('morgan');
const WebSocketServer = require('websocket').server;
const http = require('http');
const config = require('./config');

const server = http.createServer();

const state = {
  time: 0,
  pause: true,
  onlineCount: 0,
};
const clients = {};
let connectionIndex = 1;

server.listen(config.wsPort, () => console.log((new Date()) + ` WebSocket Server is listening on port ${config.wsPort}`));

const ws = new WebSocketServer({
  httpServer: server,
  // You should not use autoAcceptConnections for production
  // applications, as it defeats all standard cross-origin protection
  // facilities built into the protocol and the browser.  You should
  // *always* verify the connection's origin and decide whether or not
  // to accept it.
  // autoAcceptConnections: true,
});

function broadcast(data, except) {
  const msg = JSON.stringify(data);

  Object.keys(clients).forEach((key) => {
    if (key !== except) {
      clients[key].sendUTF(msg);
    }
  });
}

ws.on('request', (request) => {
  const connection = request.accept(null, request.origin);
  const clientKey = connectionIndex.toString();
  connectionIndex++;
  clients[clientKey] = connection;

  console.log('New client', clientKey);

  state.onlineCount++;

  broadcast({
    type: 'onlineCount',
    onlineCount: state.onlineCount,
  });

  const sendClients = {};

  // Initial state for client
  connection.sendUTF(JSON.stringify({
    ...state,
    sendClients,
    type: 'init',
  }));

  connection.on('message', (message) => {
    if (message.type === 'utf8') {
      const data = JSON.parse(message.utf8Data);

      console.log(data);

      if (data.type === 'pause') {
        state.pause = true;
        state.time = data.time;

        broadcast({ type: 'pause', time: state.time }, clientKey);
      }

      if (data.type === 'play') {
        state.pause = false;
        state.time = data.time;

        broadcast({ type: 'play', time: state.time }, clientKey);
      }

      if (data.type === 'time') {
        state.time = data.time;
        broadcast({ type: 'time', time: state.time }, clientKey);
      }

      if (data.type === 'ready') {
        clients[clientKey].state = 'ready';
        broadcast({ type: 'userState', id: clientKey, state: clients[clientKey].state });
      }

      if (data.type === 'loading') {
        clients[clientKey].state = 'loading';
        broadcast({ type: 'userState', id: clientKey, state: clients[clientKey].state });
      }
    }
  });

  connection.on('close', () => {
    console.log('Client disconnected', clientKey);

    delete clients[clientKey];
    state.onlineCount--;

    console.log(`${state.onlineCount} clients`);

    broadcast({
      type: 'onlineCount',
      onlineCount: state.onlineCount,
    });
  });
});

const app = express();

app.use(logger('dev'));
app.use(express.json());

module.exports = app;
