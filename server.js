const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const https = require('https');
const uuid = require('uuid/v4');

var key = fs.readFileSync('example-com.key.pem');
var cert = fs.readFileSync('example-com.cert.pem');

var options = {key, cert};

const server = https.createServer(options, app);
const io = require('socket.io')(server);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});

server.listen(3000, () => {
    console.log('listening on port 3000');
});

let numClients = 0;
io.on('connection', socket => {
    socket.on('send join', () => {
        let clientId = socket.id;
        socket.broadcast.emit('receive client joined', clientId);
    });
    socket.on('send offer', ({offer, toClientId}) => {
        let fromClientId = socket.id;
        socket.to(toClientId).emit('receive offer', {offer, fromClientId});
    });
    socket.on('send answer', ({answer, toClientId}) => {
        let fromClientId = socket.id;
        socket.to(toClientId).emit('receive answer', {answer, fromClientId});
    });

    socket.on('send ice candidate', ({candidate, toClientId}) => {
        let fromClientId = socket.id;
        socket.to(toClientId).emit('receive ice candidate', {candidate, fromClientId});
    });

    socket.on('disconnect', () => {
        let clientId = socket.id;
        socket.broadcast.emit('receive client leave', clientId);
    });
});
module.exports = {
    app
};

