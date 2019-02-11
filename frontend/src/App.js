import React, { Component } from 'react';
import Plyr from 'plyr';
import socket from './socket';
import OnlineCount from './OnlineCount';

import 'plyr/dist/plyr.css';
import './App.css';

// let pauseAfterSeek = true;

class App extends Component {
  state = {
    films: [],
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
          console.log('player seek listener', e.target);

          console.log('Changing time...');

          this.player.currentTime = e.target.valueAsNumber / 100 * this.player.duration;

          this.player.once('canplaythrough', () => {
            console.log('Time changed. Sending to others...');

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
    });

    this.player.on('seeked', (e) => {
      console.log('seeked');
      // if (pauseAfterSeek)
      //   this.player.pause();
    });

    this.player.on('playing', (e) => {
      console.log('playing event');
    });

    this.player.on('loadeddata', (e) => {
      console.log('loadeddata event');
    });

    this.player.on('canplay', (e) => {
      console.log('canplay event');
    });

    this.player.on('canplaythrough', (e) => {
      console.log('canplaythrough event');
    });

    this.player.on('waiting', (e) => {
      console.log('waiting event');
    });

    this.player.on('pause', (e) => {
      console.log('pause event');
    });

    this.player.on('ready', (e) => {
      console.log('ready event');

      setTimeout(() => {
        this.seek(this.currentState.time);
      }, 10);

      if (this.currentState.pause) {
        this.player.pause();
      } else {
        this.player.play();
      }
    });

    // Socket
    socket.on('message', this.onMessage);
    socket.on('close', () => {
      document.body.innerHTML = 'connection closed';
    });
    socket.on('error', (e) => {
      document.body.innerHTML = e;
    });
  }

  seek(time) {
    socket.send({
      type: 'loading',
    });

    this.player.currentTime = time;

    this.player.once('canplaythrough', () => socket.send({
      type: 'ready',
    }));
  }

  onMessage = (data) => {
    if (data.type === 'init') {
      this.currentState = data;

      this.setState({
        films: data.films,
      });

      if (data.film) {
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
      this.player.pause();
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
    }
  };

  componentWillUnmount() {
    if (this.player) {
      // this.player.dispose();
    }

    socket.removeListener('message', this.onMessage);

    if (socket.isOpen()) {
      socket.close();
    }
  }

  onSelect = (e) => {
    socket.send({
      type: 'selectFilm',
      filmId: e.target.value,
    });
  };

  render() {
    const { films } = this.state;

    return (
      <div className="App">
        <video id="player" ref={this.videoRef}/>

        <OnlineCount/>

        <select onChange={this.onSelect} className="FilmSelect">
          <option>-- choose film --</option>
          {films.map(film =>
            <option key={film.id} value={film.id}>{film.name}</option>,
          )}
        </select>

        <div id="msg"/>
      </div>
    );
  }
}

export default App;
