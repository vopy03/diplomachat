"use strict";

const fs = require("node:fs");
const https = require("node:https");
const WebSocket = require("ws");
const crypto = require("crypto");
const path = require("path"); // Import the path module

const tools = require("./tools.js");

let params = {};
changeParams();
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
  params = tools.getPublicKnownVariables(4, 90000000, 100000000000);
  params.iv = crypto.randomBytes(12);
  params.iv = params.iv.toString("hex");
}

const server = https.createServer(options, (req, res) => {
  let filePath = "./public" + req.url;

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
      } else if (type === "stopped typing") {
        // Send stopped typing notification to recipient
        sendStoppedTypingNotification(senderCode, recipient);
      }
      if (type === "get_public_vars") {
        connection.send(JSON.stringify({ type: "public_vars", params }));
      }
      if (type === "public_key_exchange") {
        const recipientConnection = connections.get(recipient);
        if (
          recipientConnection &&
          recipientConnection.readyState === WebSocket.OPEN
        ) {
          recipientConnection.send(
            JSON.stringify({ type, sender: senderCode, key: data.key })
          );
        } else {
          connection.send(`Recipient ${recipient} not found or not connected.`);
          // Handle recipient not found error here
        }
      }
      if (type === "set_sender") {
        if (!sender) {
          sender = senderCode;
          if (connections.has(sender)) {
            connection.send(
              "Sender code already in use. Please try again with a different code."
            );
            // dont close
            connection.close();
            return;
          }
          connections.set(sender, connection);
          console.log(sender);
          connection.send("Sender code set successfully.");
        } else {
          connection.send("Sender code is already set.");
        }
      } else if (type === "message") {
        if (!sender) {
          connection.send(
            "Sender code is not set. Please set the sender code first."
          );
          return;
        }

        const recipientConnection = connections.get(recipient);
        if (
          recipientConnection &&
          recipientConnection.readyState === WebSocket.OPEN
        ) {
          recipientConnection.send(
            JSON.stringify({ type, sender: senderCode, message: msg })
          );
        } else {
          connection.send(`Recipient ${recipient} not found or not connected.`);
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
    recipientData.send(
      JSON.stringify({ type: "stopped typing", sender: sender })
    );
  }
};
