import React, { Component } from 'react';
import Plyr from 'plyr';
import socket from './socket';
// import 'video.js/dist/video-js.css';
import OnlineCount from './OnlineCount';
import Hls from 'hls.js';

import 'plyr/dist/plyr.css';
import './App.css';

// let pauseAfterSeek = true;

class App extends Component {
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

    if (Hls.isSupported()) {
      console.log("hello hls.js!");
    }
    //
    if (!Hls.isSupported()) {
      this.videoRef.current.src = 'http://192.168.1.230/hls/stream.m3u8';
    } else {
      // For more Hls.js options, see https://github.com/dailymotion/hls.js
      const hls = new Hls();
      hls.loadSource('http://192.168.1.230/hls/stream.m3u8');
      hls.attachMedia(this.videoRef.current);
    }

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
        <video id="player" src="http://192.168.1.230/hls/stream.m3u8" ref={this.videoRef}/>
        <OnlineCount/>
        <div id="msg"/>
      </div>
    );
  }
}

export default App;
