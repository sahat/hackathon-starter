module.exports = (socketIo) => {
	return {
	  onMessage: (client) => {
	    return (data) => {
	      console.log('recieved client message :', data);
	      socketIo.emit('message', `Hello client ${client.id}`);
	    };
	  },
	  onDisconnected: (client) => {
	  	return () => {
	  		console.log('client disconnected: ', client.id);
	  	}
	  }
	}
};
