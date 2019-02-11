import React, { Component } from 'react';
import Plyr from 'plyr';
import socket from './socket';
import OnlineCount from './OnlineCount';

import 'plyr/dist/plyr.css';
import './App.css';

class App extends Component {
  state = {
    films: [],
    error: null,
  };
  player = null;
  videoRef = null;
  currentState = {};

  constructor(props) {
    super(props);

    this.videoRef = React.createRef();
  }

  componentDidMount() {
    window.player = this.player = new Plyr(this.videoRef.current, {
      listeners: {
        play: () => {
          if (this.player.paused) {
            console.log('play listener');

            this.player.play();

            socket.send({
              type: 'play',
              time: this.player.currentTime,
            });
          } else {
            console.log('pause listener');

            this.player.pause();

            socket.send({
              type: 'pause',
              time: this.player.currentTime,
            });
          }
        },
        seek: (e) => {
          console.log('Seek. Changing time...');

          this.player.currentTime = e.target.valueAsNumber / 100 * this.player.duration;

          this.player.once('canplaythrough', () => {
            console.log('Time changed. Pause to send to the server...');

            this.player.pause();

            socket.send({
              type: 'time',
              time: this.player.currentTime,
            });
          });
        },
      },
      clickToPlay: false,
      invertTime: false,
      settings: [],
    });

    this.player.on('seeked', (e) => {
      console.log('seeked');
    });

    this.player.on('playing', (e) => {
      console.log('playing e');
    });

    this.player.on('canplaythrough', (e) => {
      console.log('canplaythrough e');
    });

    this.player.on('waiting', (e) => {
      console.log('waiting e');
    });

    this.player.on('pause', (e) => {
      console.log('pause e');
    });

    // Socket
    socket.on('message', this.onMessage);
    socket.on('close', () => this.setState({
      error: 'Connection error',
    }));
    socket.on('error', (e) => this.setState({
      error: 'Websocket error: ' + e.message,
    }));
  }

  seek(time, onReady) {
    socket.send({
      type: 'loading',
    });

    this.player.currentTime = time;

    this.player.once('canplaythrough', () => {
      socket.send({
        type: 'ready',
      });

      if (onReady) onReady();
    });
  }

  onMessage = (data) => {
    if (data.type === 'init') {
      this.currentState = data;

      this.setState({
        films: data.films,
      });

      if (data.film) {
        console.log('Loading initial film...');

        this.player.source = {
          type: 'video',
          title: data.film.name,
          sources: [
            {
              src: data.film.url,
              type: 'video/mp4',
            },
          ],
        };

        this.player.once('ready', (e) => {
          console.log('once ready e');

          this.player.once('canplaythrough', () => {
            console.log('first');

            this.player.once('canplaythrough', () => {
              console.log('second');

              setTimeout(() => {
                console.log('Seeking to', this.currentState.time);

                this.seek(this.currentState.time, () => this.seek(this.currentState.time));
              }, 10);

              if (this.currentState.pause) {
                this.player.pause();
              } else {
                this.player.play();
              }
            });
          });

          // setTimeout(() => {
          //   console.log('Seeking to', this.currentState.time);
          //
          //   this.seek(this.currentState.time);
          // }, 100);

          // if (this.currentState.pause) {
          //   this.player.pause();
          // } else {
          //   this.player.play();
          // }
        });
      }
    }

    if (data.type === 'time') {
      this.player.pause();

      this.seek(data.time);
    }

    if (data.type === 'pause') {
      this.player.pause();

      if (Math.abs(this.player.currentTime - data.time) > 1) {
        this.seek(data.time);
      }
    }

    if (data.type === 'play') {
      this.player.play();

      if (Math.abs(this.player.currentTime - data.time) > 1) {
        this.seek(data.time);
      }
    }

    if (data.type === 'selectFilm') {
      this.player.source = {
        type: 'video',
        title: data.film.name,
        sources: [
          {
            src: data.film.url,
            type: 'video/mp4',
          },
        ],
      };

      this.player.once('ready', (e) => {
        console.log('once ready e');

        setTimeout(() => {
          console.log('Seeking to', this.currentState.time);

          this.seek(this.currentState.time);
        }, 10);

        if (this.currentState.pause) {
          this.player.pause();
        } else {
          this.player.play();
        }
      });
    }
  };

  onSelect = (e) => {
    socket.send({
      type: 'selectFilm',
      filmId: e.target.value,
    });
  };

  render() {
    const { films, error } = this.state;

    return (
      <div className="App">
        <video id="player" ref={this.videoRef}/>

        <OnlineCount/>

        <select onChange={this.onSelect} className="FilmSelect">
          <option>-- Choose Film --</option>
          {films.map(film =>
            <option key={film.id} value={film.id}>{film.name}</option>,
          )}
        </select>

        <div id="msg">
          {error}
        </div>
      </div>
    );
  }
}

export default App;
