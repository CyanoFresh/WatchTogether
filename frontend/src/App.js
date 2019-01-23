import React, { Component } from 'react';
import Plyr from 'plyr';
import socket from './socket';
// import 'video.js/dist/video-js.css';
import OnlineCount from './OnlineCount';

import './App.css';
import 'plyr/dist/plyr.css';

let pauseAfterSeek = true;

class App extends Component {
  player = null;

  componentDidMount() {
    // Init player
    window.player = this.player = new Plyr('#player', {
      listeners: {
        play: (e) => {
          console.log('player play listener', e);

          if (this.player.paused) {
            this.player.play();

            socket.send({
              type: 'play',
              time: this.player.currentTime,
            });
          } else {
            this.player.pause();

            socket.send({
              type: 'pause',
              time: this.player.currentTime,
            });
          }
        },
        seek: (e) => {
          console.log('player seek listener', e);

          pauseAfterSeek = true;

          this.player.currentTime = e.target.valueAsNumber / 100 * this.player.duration;

          socket.send({
            type: 'time',
            time: this.player.currentTime,
          });
        },
      },
      clickToPlay: false,
      invertTime: false,
    });

    this.player.on('mousedown', (e) => {
      if (e.target.classList.contains('plyr__poster')) {
        if (this.player.paused) {
          this.player.play();

          socket.send({
            type: 'play',
            time: this.player.currentTime,
          });
        } else {
          this.player.pause();

          socket.send({
            type: 'pause',
            time: this.player.currentTime,
          });
        }
      }
    });

    this.player.on('seeked', (e) => {
      if (pauseAfterSeek)
        this.player.pause();
    });

    // Socket
    socket.on('message', this.onMessage);
  }

  onMessage = (data) => {
    if (data.type === 'init') {
      this.player.currentTime = data.time;

      if (!data.pause) {
        this.player.play();
      }
    }

    if (data.type === 'time') {
      this.player.pause();

      pauseAfterSeek = true;
      this.player.currentTime = data.time;
    }

    if (data.type === 'pause') {
      this.player.pause();

      pauseAfterSeek = true;
      this.player.currentTime = data.time;
    }

    if (data.type === 'play') {
      pauseAfterSeek = false;
      this.player.currentTime = data.time;

      this.player.play();
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

  render() {
    return (
      <div className="App">
        <video id="player" src="./video.m4v" playsInline controls/>
        <OnlineCount/>
      </div>
    );
  }
}

export default App;
