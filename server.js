'use strict';

const fs = require('node:fs');
const https = require('node:https');
const WebSocket = require('ws');
const crypto = require('crypto');

// let prime = generatePrime(); // Генеруємо початкове просте число
// let generator = getRandomGenerator(prime); // Вибираємо генератор

const index = fs.readFileSync('./index.html', 'utf8');


const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const server = https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end(index);
});

server.listen(8000, () => {
  console.log('Listen port 8000');
});

const wss = new WebSocket.Server({ server });
const connections = new Map();
const connection_logins = new Map();

wss.on('connection', (connection, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`Connected ${ip}`);

  let sender;

  connection.on('message', (message) => {
    try {
      const { type, sender: senderCode, recipient, message: msg } = JSON.parse(message);
      console.log(JSON.parse(message));
      if (type === 'typing') {
        // Send typing notification to recipient
        sendTypingNotification(senderCode, recipient);
      } else if (type === 'stopped typing') {
        // Send stopped typing notification to recipient
        sendStoppedTypingNotification(senderCode, recipient);
      }
      if (type === 'set_sender') {
        if (!sender) {
          sender = senderCode;
          if (connections.has(sender)) {
            connection.send('Sender code already in use. Please try again with a different code.');
            // dont close
            connection.close();
            return;
          }
          connections.set(sender, connection);
          console.log(sender)
          connection.send('Sender code set successfully.');
        } else {
          connection.send('Sender code is already set.');
        }
      } else if (type === 'message') {
        if (!sender) {
          connection.send('Sender code is not set. Please set the sender code first.');
          return;
        }

        const recipientConnection = connections.get(recipient);
        if (recipientConnection && recipientConnection.readyState === WebSocket.OPEN) {
          recipientConnection.send(`From ${sender}: ${msg}`);
        } else {
          connection.send(`Recipient ${recipient} not found or not connected.`);
          // Handle recipient not found error here
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  connection.on('close', () => {
    console.log(`Disconnected ${ip}`);
    if (sender && connections.has(sender)) {
      connections.delete(sender);
    }
  });
});
const sendTypingNotification = (sender, recipient) => {
  const recipientData = connections.get(recipient);
  if (recipientData && recipientData.readyState === WebSocket.OPEN) {
    recipientData.send(JSON.stringify({ type: "typing", sender }));
  }
};

const sendStoppedTypingNotification = (sender, recipient) => {
  const recipientData = connections.get(recipient);
  if (recipientData && recipientData.readyState === WebSocket.OPEN) {
    recipientData.send(JSON.stringify({ type: "stopped typing", sender: sender }));
  }
};