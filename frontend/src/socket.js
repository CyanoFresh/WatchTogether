import EventEmitter from 'events';

class Socket extends EventEmitter {
  connection = null;
  reconnecting = false;

  constructor(open = true) {
    super();

    if (open) {
      this.open();
    }
  }

  open() {
    this.connection = new WebSocket(process.env.REACT_APP_WS_URL);
    this.connection.onopen = () => {
      console.log('Socket opened');

      this.emit('open', this.reconnecting);

      this.reconnecting = false;
    };
    this.connection.onclose = (e) => {
      console.log('Socket closed', e);

      this.emit('close', e);

      // Reconnect
      setTimeout(() => {
        console.log('Socket reconnecting...');

        this.reconnecting = true;
        this.emit('reconnecting');

        this.open();
      }, 2000);
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