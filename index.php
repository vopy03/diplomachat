<!DOCTYPE html>
<html>

<head>
  <title>Chat</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>

<body>
  <h1>Chat</h1>
  <div id='isSenderTyping'></div>
  <div id="chat"></div>
  <input id="sender" type="text" placeholder="Your code" />
  <button id="setSender">Set Sender</button>
  <input id="recipient" type="text" placeholder="Recipient's code" />
  <input id="msg" type="text" />
  <button id="sendButton">Send</button>
  <style>
    input {
      border: 1px solid green;
    }
  </style>
  <script>
    const CHAR_RETURN = 13;

    const socket = new WebSocket("wss://" + window.location.host);
    const chat = document.getElementById("chat");
    const senderInput = document.getElementById("sender");
    const setSenderButton = document.getElementById("setSender");
    const recipientInput = document.getElementById("recipient");
    const msg = document.getElementById("msg");
    const sendButton = document.getElementById("sendButton");
    var TOStopTyping = [];
    var isTyping = false;
    var senderTyping = false;
    msg.focus();

    const writeLine = (text) => {
      const line = document.createElement("div");
      line.innerHTML = `<p>${text}</p>`;
      chat.appendChild(line);
    };

    const sendTypingNotification = () => {
      isTyping = true;
      const sender = senderInput.value.trim();
      const recipient = recipientInput.value.trim();
      const message = "typing";
      socket.send(
        JSON.stringify({
          type: "typing",
          sender,
          recipient,
          message,
        })
      );
    };

    const sendStoppedTypingNotification = () => {
      isTyping = false;
      const sender = senderInput.value.trim();
      const recipient = recipientInput.value.trim();
      const message = "stopped typing";
      socket.send(
        JSON.stringify({
          type: "stopped typing",
          sender,
          recipient,
          message,
        })
      );
    };

    // Event listener for typing indicator
    msg.addEventListener("input", () => {
      if (!isTyping) {
        sendTypingNotification();
      }
      clearTimeout(TOStopTyping);
      TOStopTyping = setTimeout(() => {
        sendStoppedTypingNotification();
      }, 1000);
    });

    // Function to send a message
    const sendMessage = () => {
      const sender = senderInput.value.trim();
      const recipient = recipientInput.value.trim();
      const message = msg.value.trim();
      if (sender && recipient && message) {
        const payload = JSON.stringify({
          type: "message",
          sender,
          recipient,
          message,
        });
        console.log(payload);
        socket.send(payload);
        msg.value = "";
        writeLine(`You to ${recipient}: ${message}`);
      } else {
        alert("Please fill in all fields.");
      }
    };

    // Function to handle setting the sender code
    const setSender = () => {
      const sender = senderInput.value.trim();
      if (sender) {
        const payload = JSON.stringify({ type: "set_sender", sender });
        socket.send(payload);
        senderInput.disabled = true;
        setSenderButton.disabled = true;
        senderInput.classList.add("disabled");
        setSenderButton.classList.add("disabled");
        writeLine(`Sender code set: ${sender}`);
      } else {
        alert("Please enter a valid sender code.");
      }
    };

    setSenderButton.addEventListener("click", setSender);

    socket.addEventListener("open", () => {
      writeLine("connected");
    });

    socket.addEventListener("close", () => {
      writeLine("closed");
    });

    socket.addEventListener("message", ({ data }) => {
      // chack if is JSON string and check if type is "typing"
      console.log(data);
      if (
        isJSON(data)
      ) {
        data = JSON.parse(data)
        if (data.type === "typing")
          senderTyping = true
        else if (data.type === "stopped typing")
          senderTyping = false
        else
          writeLine(data);
        updateTypingNotify(data);
      }});

    msg.addEventListener("keydown", (event) => {
      if (event.keyCode === CHAR_RETURN) {
        sendMessage();
      }
    });

    function updateTypingNotify(data) {
      if (isJSON(data)) {
        data = JSON.parse(data)
        let sender = data.sender;
        const isSenderTypingDiv = document.getElementById("isSenderTyping");
        if (senderTyping) {
          isSenderTypingDiv.innerHTML = "Sender " + sender + " is typing...";
        } else {
          isSenderTypingDiv.innerHTML = "";
        }
      }
    }

    function isJSON(str) {
      try {
        JSON.parse(str);
      } catch (e) {
        return false;
      }
      return true;
    }

    sendButton.addEventListener("click", sendMessage);
  </script>
</body>

</html>