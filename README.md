# A vanilla JS WebRTC sample app that supports text and audio
A WebRTC app that supports group (many-to-many) peer clients. 

The implementation is based on a tutorial found on [medium.com](https://medium.com/@coldbrewtesting/getting-started-with-webrtc-and-test-driven-development-1cc6eb36ffd) and [a google codelab](https://codelabs.developers.google.com/codelabs/webrtc-web/)

## Getting started
 - Download dependencies with ```npm install```
 - Generated a self-signed certificate 
 ```
 openssl req -new -x509 -sha256 -newkey rsa:2048 -nodes     -keyout example-com.key.pem -days 365 -out example-com.cert.pem
 ```
 - Run the server using ```node server.js```
 - Open your browser on ```https://localhost:3000/``` and skip the warnings shown.
