/**
 *  Socket.io
 */

module.exports = function( io ) {

    io.on('connection', function (socket) {
        console.log('Socket.io: New connection');
        socket.emit('app:welcome' , 'Socket.io: Hello from the server'); //

        /*
        socket.on('app:event', function (user) {

            // Broadcast to everyone
            io.emit('app:event', user);

            // Reply to the user sending the event
            socket.emit('app:event', user);
        });
        */
    });

}