let socket = null;
let dataChannels = {};
let peerConnections = {};
const SERVERS = null;

let localStream = null;
let localAudio = new Audio();
let remoteAudio = {};

const userMediaConstraints = {
    audio: true,
    video: false
};

const offerOptions = {
    offerToReceiveVideo: 0,
    offerToReceiveAudio: 1
};


function createRTC(socket, clientId) {
    let peerConnection = new RTCPeerConnection(SERVERS);

    peerConnection.addStream(localStream);

    peerConnection.onicecandidate = (e) => {
        if (e.candidate) {
            console.log('send ice candidate to ' + clientId);
            socket.emit('send ice candidate', {candidate: e.candidate, toClientId: clientId});
        }
    };

    peerConnection.onaddstream = (e) => {
        console.log("Remote stream was added!");
        remoteAudio[clientId] = new Audio();
        remoteAudio[clientId].srcObject = e.stream;
        remoteAudio[clientId].play();
    }

    return peerConnection;
}

function initiateSignaling(socket, peerConnection, clientId) {
    initiateDataChannel(peerConnection, clientId);

    peerConnection.createOffer(offerOptions).then(
        offer => {
            peerConnection.setLocalDescription(offer);
            console.log('send offer to ' + clientId);
            socket.emit('send offer', {offer, toClientId: clientId});
        },
        err => {
            if (err) throw err;
        });
}

function initiateDataChannel(peerConnection, clientId) {
    dataChannel = peerConnection.createDataChannel(
        'messageChannel',
        { reliable: false }
    );

    dataChannel.onopen = () => {
        console.log('open datachannel');
        dataChannel.onmessage = (message) => {
            console.log('ondatachannel onmessage (initiateDataChannel)');
            const data = JSON.parse(message.data);
            handleIncomingMessage(data.message)
        }
    };

    dataChannels[clientId] = dataChannel;
}

function sendAnswer(socket, offer, peerConnection, toClientId) {
    peerConnection.setRemoteDescription(offer);
    peerConnection.createAnswer((answer) => {
        peerConnection.setLocalDescription(answer);
        console.log('send answer to ' + toClientId);
        socket.emit('send answer', {answer, toClientId});
    }, (err) => {
        if (err) throw err;
    });
}

$(document).ready(() => {

    navigator.mediaDevices
        .getUserMedia(userMediaConstraints)
        .then(function(stream) {
            localStream = stream;
            socket.emit('send join');
            console.log('join');
        })
        .catch(function(e) {
            alert('getUserMedia() error: ' + e.name);
        });

    socket = io();

    socket.on('receive client joined', function(clientId) {
        console.log('new client joined ('+clientId+')');
        peerConnection = createRTC(socket, clientId);
        initiateSignaling(socket, peerConnection, clientId);
        peerConnections[clientId] = peerConnection;
    });

    socket.on('receive offer', ({offer, fromClientId}) => {
        console.log('receive offer from ' + fromClientId);
        let peerConnection = createRTC(socket, fromClientId);
        sendAnswer(socket, offer, peerConnection, fromClientId);

        peerConnection.ondatachannel = (e) => {
            dataChannel = e.channel;

            dataChannel.onmessage = (message) => {
                console.log('ondatachannel onmessage');
                const data = JSON.parse(message.data);
                handleIncomingMessage(data.message);
            };

            dataChannels[fromClientId] = dataChannel;
        };

        peerConnections[fromClientId] = peerConnection;
    });

    socket.on('receive answer', ({answer, fromClientId}) => {
        console.log('receive answer from ' + fromClientId);
        peerConnections[fromClientId].setRemoteDescription(answer);
    });

    socket.on('receive ice candidate', ({candidate, fromClientId}) => {
        console.log('receive ice candidate from ' + fromClientId);
        console.log(candidate);
        peerConnections[fromClientId].addIceCandidate(candidate);
    });

    socket.on('receive client leave', function(clientId) {
        console.log('client leave ('+clientId+')');
        delete peerConnections[clientId];
        delete dataChannels[clientId];
    });

    $('window').on('unload', () => {
        socket.emit('leave page');
    });

    $('form').on('submit', (e) => {
        e.preventDefault();
    });

    $('#sendMessage').on('click', function() {
        const message = $(this).siblings()[0].value;
        handleIncomingMessage(message);
        $(this).siblings()[0].value = "";

        const data = JSON.stringify({ type: 'message', message });
        for(var k in dataChannels) {
            dataChannels[k].send(data);
        }
    });

    $('#listClients').on('click', function() {
        for(var k in peerConnections) {
            console.log(k+" "+peerConnections[k].iceConnectionState);
        }
        for(var k in dataChannels) {
            console.log(k+" "+dataChannels);
        }
    });

});

function handleIncomingMessage(message) {
    const messageElement = $('<p></p>', { class: 'message'});
    messageElement.text(message);
    $('#chat-window').append(messageElement);
}