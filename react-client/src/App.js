import socketIo from 'socket.io-client';

import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {

	componentDidMount() {
		this.socket = socketIo.connect(process.env.REACT_APP_SOCKET_HOST_DEV);
		this.socket.on('connect', () => { console.log('socket connected'); });
		this.socket.emit('message', 'Hello Socket server');
		this.socket.on('message', (data) => { console.log('recieved socket server message: ', data); });
		this.socket.on('disconnect', () => { console.log('socket disconnected'); });
	}

	render() {
		return (
			<div className="App">
				<header className="App-header">
					<img src={logo} className="App-logo" alt="logo" />
					<h1 className="App-title">Welcome to React</h1>
				</header>
				<p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
				</p>
			</div>
		);
	}
}

export default App;
