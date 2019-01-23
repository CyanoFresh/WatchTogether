import React, { Component } from 'react';
import socket from './socket';

class OnlineCount extends Component {
  state = {
    onlineCount: 0,
  };

  constructor(props) {
    super(props);

    if (this.props.onlineCount) {
      this.state.onlineCount = this.props.onlineCount;
    }
  }

  componentDidMount() {
    socket.on('message', this.onMessage);
  }

  componentWillUnmount() {
    socket.removeListener('message', this.onMessage);
  }

  onMessage = (data) => {
    if (data.type === 'onlineCount' || data.type === 'init') {
      this.setState({
        onlineCount: data.onlineCount,
      });
    }
  };

  render() {
    const { onlineCount } = this.state;

    return (
      <div className="OnlineCount">
        {onlineCount}
      </div>
    );
  }
}

export default OnlineCount;