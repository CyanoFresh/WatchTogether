const WebSocketServer = require('websocket').server;
const http = require('http');
const uniqid = require('uniqid');
const fs = require('fs').promises;
const config = require('./config');

const server = http.createServer();

const state = {
  time: 0,
  pause: true,
  onlineCount: 0,
  film: null,
};
const clients = {};
let films = [];
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

  // Initial state for client
  connection.sendUTF(JSON.stringify({
    type: 'init',
    films,
    ...state,
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

      if (data.type === 'selectFilm') {
        const film = films.find(film => film.id === data.filmId);

        if (!film) {
          console.error('Film not found');
          return;
        }

        state.film = film;
        state.time = 0;
        state.pause = true;

        broadcast({
          type: 'selectFilm',
          film: film,
        });
      }

      if (data.type === 'loadFilms') {
        loadFilms().then(() => {
          console.log('film list updated', films);

          broadcast({
            type: 'films',
            films,
          });
        });
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

function loadFilms() {
  return fs.readdir(config.filmsDirPath)
    .then(results => {
      console.log(results);

      const newFilms = [];

      results.forEach(fileName => {
        newFilms.push({
          id: uniqid(),
          name: fileName,
          url: `${config.filmsDirUrl}/${fileName}`,
        });
      });

      films = newFilms;

      return films;
    })
    .catch(err => {
      console.error(err);

      process.exit();
    });
}

loadFilms();