"use strict";

const fs = require("node:fs");
const https = require("node:https");
const WebSocket = require("ws");
const crypto = require("crypto");
const path = require("path"); // Import the path module

// const tools = require("./tools.js");
let primes = [];

fs.readFile("./assets/primenums.txt", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }
  primes = data.split("\r\n");
  changeParams();
});

// console.log(primes)

let params = {};

const index = fs.readFileSync("./public/index.html", "utf8");

const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

// set interval Each 30 mins change iv for AES
setInterval(() => {
  changeParams();
}, 30 * 60 * 1000);

function changeParams() {
  params = getPublicKnownVariables(4);
  params.iv = crypto.randomBytes(12);
  params.iv = params.iv.toString("hex");
}

const server = https.createServer(options, (req, res) => {
  let filePath = req.url;
  if (!filePath.includes("node_modules")) {
    filePath = "./public" + req.url;
  }
  // if filepath has "node_modules"

  if (filePath === "./public/") {
    filePath = "./public/index.html"; // Serve index.html by default from the public directory
  }

  const extname = path.extname(filePath);
  let contentType = "text/html";
  switch (extname) {
    case ".js":
      contentType = "text/javascript";
      break;
    case ".css":
      contentType = "text/css";
      break;
    case ".svg":
      contentType = "image/svg+xml";
      break;
    case ".png":
      contentType = "image/png";
      break;
    case ".jpg":
    case ".jpeg":
      contentType = "image/jpg";
      break;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404);
        res.end("File not found");
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

server.listen(8000, () => {
  console.log("Listen port 8000");
});

const wss = new WebSocket.Server({ server });
const connections = new Map();

wss.on("connection", (connection, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`Connected ${ip}`);

  let sender;

  connection.on("message", (data) => {
    try {
      const {
        type,
        sender: senderCode,
        recipient,
        message: msg,
      } = JSON.parse(data);
      data = JSON.parse(data);
      console.log(data);
      if (type === "typing") {
        // Send typing notification to recipient
        sendTypingNotification(senderCode, recipient);
      } else if (type === "stop_typing") {
        // Send stop_typing notification to recipient
        sendStoppedTypingNotification(senderCode, recipient);
      }
      if (type === "get_public_vars") {
        connection.send(JSON.stringify({ type: "public_vars", params }));
      }
      if (type === "user_online") {
        const recipientConnection = connections.get(recipient);
        if (
          recipientConnection &&
          recipientConnection.readyState === WebSocket.OPEN
        ) {
          connection.send(
            JSON.stringify({ type: "user_online", status: true })
          );
        } else {
          connection.send(
            JSON.stringify({ type: "user_online", status: false })
          );
        }
      }
      if(type === "check_profile_setings") {
        const recipientConnection = connections.get(recipient);
        if (
          recipientConnection &&
          recipientConnection.readyState === WebSocket.OPEN
        ) {
          recipientConnection.send(
            JSON.stringify({
              type,
              sender: senderCode,
              recipient: recipient,
              data: data.data,
            })
          );
        }
      }
      if (type === "public_key_exchange") {
        const recipientConnection = connections.get(recipient);
        if (
          recipientConnection &&
          recipientConnection.readyState === WebSocket.OPEN
        ) {
          recipientConnection.send(
            JSON.stringify({
              type,
              status: true,
              sender: senderCode,
              key: data.key,
            })
          );
        } else {
          connection.send(
            JSON.stringify({
              type,
              status: false,
              message: `Recipient ${recipient} not found or not connected.`,
            })
          );
          // Handle recipient not found error here
        }
      }
      if (type === "send_disconnect_notification") {
        let recipients = data.recipients;
        recipients.forEach((recipient) => {
          const recipientConnection = connections.get(recipient);
          if (
            recipientConnection &&
            recipientConnection.readyState === WebSocket.OPEN
          ) {
            recipientConnection.send(
              JSON.stringify({
                type: "disconnect_notification",
                sender: senderCode,
              })
            );
          }
        });
      }
      if (type === "set_sender") {
        if (!sender) {
          sender = senderCode;
          if (connections.has(sender)) {
            connection.send(
              JSON.stringify({
                type: "set_sender",
                status: false,
                message:
                  "This login already in use. Please try again with a different one.",
              })
            );
            sender = undefined;
            return;
          }
          connections.set(sender, connection);
          console.log(sender);
          connection.send(
            JSON.stringify({
              type: "set_sender",
              status: true,
              sender: senderCode,
              message: "Sender code set successfully.",
            })
          );
        } else {
          connection.send(
            JSON.stringify({
              type: "set_sender",
              status: true,
              message: "Sender code is already set.",
            })
          );
        }
      } else if (type === "message") {
        if (!sender) {
          connection.send(
            "Login is not set. Please set the login first."
          );
          return;
        }

        const recipientConnection = connections.get(recipient);
        if (
          recipientConnection &&
          recipientConnection.readyState === WebSocket.OPEN
        ) {
          recipientConnection.send(
            JSON.stringify({
              type,
              status: true,
              sender: senderCode,
              message: msg,
            })
          );
        } else {
          connection.send(
            JSON.stringify({
              type,
              status: false,
              message: `Recipient ${recipient} not found or not connected.`,
            })
          );
          // Handle recipient not found error here
        }
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  connection.on("close", () => {
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
    recipientData.send(JSON.stringify({ type: "stop_typing", sender: sender }));
  }
};

function getPublicKnownVariables(k) {
  let primeNums = [];
  for (let i = 0; i < k; i++) {
    let res = getRandomPrimeNum();
    console.log(res);
    primeNums.push(res);
  }

  console.log("Прості числа: " + primeNums);
  let primeNumber = primeNums[Math.floor(Math.random() * primeNums.length)];
  console.log("Вибране просте число (p): " + primeNumber);

  let alphaA = getRandomPrimeNumSmallerThan(primeNumber);
  console.log("Число а (alpha): " + alphaA);

  return { prime: primeNumber, generator: alphaA };
}

function getRandomPrimeNum() {
  // Get a random prime number
  const randomIndex = Math.floor(Math.random() * primes.length);
  const randomPrime = primes[randomIndex];
  console.log("Random prime number:", randomPrime);
  return randomPrime;
}
function getRandomPrimeNumSmallerThan(num) {
  // Get another random prime number smaller than the first one
  const smallerPrimes = primes.filter((prime) => prime < num);
  if (smallerPrimes.length > 0) {
    const smallerRandomIndex = Math.floor(Math.random() * smallerPrimes.length);
    const smallerRandomPrime = smallerPrimes[smallerRandomIndex];
    // console.log("Smaller random prime number:", smallerRandomPrime);
    return smallerRandomPrime;
  } else {
    console.log("No prime number smaller than the first one found.");
  }
}
