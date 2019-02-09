import EventEmitter from 'events';

class Socket extends EventEmitter {
  connection = null;

  constructor() {
    super();

    this.connection = new WebSocket('ws://192.168.1.76:5050');
    this.connection.onopen = () => {
      console.log('Socket opened');
      this.emit('open');
    };
    this.connection.onclose = (e) => {
      console.log('Socket closed', e);
      this.emit('close', e);
    };
    this.connection.onerror = (e) => {
      console.log('Socket error', e);
      this.emit('error', e);
    };
    this.connection.onmessage = (e) => {
      const data = JSON.parse(e.data);

      console.log('→', data);

      this.emit('message', data);
    };
  }

  isOpen() {
    return this.connection.readyState === WebSocket.OPEN;
  }

  send(data) {
    if (this.isOpen()) {
      console.log('←', data);
      this.connection.send(JSON.stringify(data));
    }
  }

  close() {
    this.connection.close();
  }
}

export default new Socket();