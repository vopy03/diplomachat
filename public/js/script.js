var keys = {};
var sharedKeys = [];
var recipientKey = 0;
var params = "";
var recipients = [];
var userNames = { example: { login: "www", displayName: "SOME NAME" } };
var ownLoginHash = "";

const CHAR_RETURN = 13;

const socket = new WebSocket("wss://" + window.location.host);
const chat = document.getElementById("chat");
const senderInput = document.getElementById("sender");
const displayName = document.getElementById("displayName");
const setSenderButton = document.getElementById("setSender");
const recipientInput = document.getElementById("recipient");
const msg = document.getElementById("msg");
const sendButton = document.getElementById("sendButton");
var TOStopTyping = [];
var isTyping = false;
var senderTyping = false;
msg.focus();

var funqueue = [];

document
  .querySelector("emoji-picker")
  .addEventListener("emoji-click", (event) => {
    console.log(event.detail);
    msg.value += event.detail.unicode;
  });

var dropdownMenu = document.querySelector(".dropdown-menu");

// Add event listener to the dropdown menu
dropdownMenu.addEventListener("click", function (event) {
  // Stop event propagation to prevent the dropdown from closing
  event.stopPropagation();
});

const writeLine = (text) => {
  const line = document.createElement("div");
  line.innerHTML = `<p>${text}</p>`;
  chat.appendChild(line);
};
var wrapFunctionQueue = function (fn, context, params) {
  return function () {
    fn.apply(context, params);
  };
};

const sendTypingNotification = async () => {
  isTyping = true;
  const sender = await sha256(senderInput.value.trim());
  const recipient = await sha256(recipientInput.value.trim());
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

const sendStoppedTypingNotification = async () => {
  isTyping = false;
  const sender = await sha256(senderInput.value.trim());
  const recipient = await sha256(recipientInput.value.trim());
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

async function getPublicVars() {
  const sender = await sha256(senderInput.value.trim());
  socket.send(
    JSON.stringify({
      type: "get_public_vars",
      sender,
    })
  );
}

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
const sendMessage = async (
  type = "message",
  sender = senderInput.value.trim(),
  recipient = recipientInput.value.trim(),
  message = msg.value.trim()
) => {
  if (type == "message" && !message) {
    showNotification("Please enter a message.");
    return;
  }
  if(type == 'send_disconnect_notification') {
    const payload = JSON.stringify({
      type,
      sender: sender,
      recipients
    });
    socket.send(payload);
    console.log(payload);
    return;
  }
  sender = await sha256(senderInput.value.trim());
  recipient = await sha256(recipientInput.value.trim());
  if (sender == recipient) {
    showNotification("You can't send a message to yourself!", "warning");
    return;
  }
  // if recipient not in list of recipients - send public key
  if (!recipients.includes(recipient)) {
    const payload = JSON.stringify({
      type: "public_key_exchange",
      sender,
      recipient,
      key: Number(keys.public),
    });
    socket.send(payload);
    funqueue.push(
      wrapFunctionQueue(sendMessage, this, [type, sender, recipient, message])
    );
    return;
  }
  
  message = msg.value.trim();
  console.log(msg);
  console.log(message);
  message = JSON.stringify({
    sender: senderInput.value,
    displayName: displayName.value,
    message: message,
  });
  writeLine(`You to ${recipientInput.value.trim()}: ${message}`);
  message = await encryptData(message, sharedKeys[recipient]);
  console.log(message);
  message = arrayBufferToString(message);
  console.log(message);
  console.log(stringToArrayBuffer(message));
  const params = { prime: 0, generator: 0 };
  if (sender && recipient && message) {
    const payload = JSON.stringify({
      type: type,
      sender,
      recipient,
      message,
    });
    console.log(payload);
    socket.send(payload);
    msg.value = "";
  } else {
    showNotification("Please fill in all fields.");
  }
};

// Function to handle setting the sender code
const setSender = async () => {
  // if sender is empty or has 3 or less symbols
  let sender = senderInput.value.trim();
  if (!sender || sender.length < 3) {
    showNotification("Please enter a valid sender code.", "info");
    return;
  }
  sender = await sha256(senderInput.value.trim());
  if (sender) {
    const payload = JSON.stringify({ type: "set_sender", sender });
    socket.send(payload);
    senderInput.disabled = true;
    setSenderButton.disabled = true;
    senderInput.classList.add("disabled");
    setSenderButton.classList.add("disabled");
    showNotification(`Sender code set: ${sender}`);
  } else {
    showNotification("Please enter a valid sender code.");
  }
};

setSenderButton.addEventListener("click", setSender);

socket.addEventListener("open", () => {
  // writeLine("connected");
  showNotification("Connected to websocket", "success");
  getPublicVars();
});

socket.addEventListener("close", () => {
  showNotification("Disconnected from websocket. Reload page.", "warning");
});

socket.addEventListener("message", async ({ data }) => {
  // chack if is JSON string and check if type is "typing"
  console.log(data);
  if (isJSON(data)) {
    data = JSON.parse(data);
    console.log(data);
    if (data.type === "message") {
      console.log("From " + data.sender + ": " + data.message);
      data.message = stringToArrayBuffer(data.message);
      data.message = await decryptData(data.message, sharedKeys[data.sender]);
      let message = "";
      console.log(data.message);
      if (isJSON(data.message)) {
        message = JSON.parse(data.message);
        userNames[data.sender] = {
          login: message.sender,
          displayName: message.displayName,
        };

        message = message.message;
        let sender;
        if (userNames[data.sender]) {
          sender = userNames[data.sender].displayName;
          if (!sender) {
            sender = userNames[data.sender].login;
          }
        }
        console.log("From " + sender + ": " + message);
        writeLine("From " + sender + ": " + message);
      }
        return;
    }
    if (data.type === "typing") {
      senderTyping = true;
    } else if (data.type === "stopped typing") {
      senderTyping = false;
    }
    if (data.type === "set_sender") {
      if (!data.status) {
        setSenderButton.disabled = false;
        senderInput.disabled = false;
      } else {
        ownLoginHash = data.sender;
      }
      showNotification(data.message);
    }
    if (data.type === "public_vars") {
      params = data.params;
      keys = generateKeys(params);
      params.iv = hexStringToArrayBuffer(params.iv);
      return;
    }
    if (data.type === "disconnect_notification") {
      let name = "";
      if (userNames[data.sender]) {
        name = userNames[data.sender].displayName;
        if (!name) {
          name = userNames[data.sender].login;
        }
      }
      showNotification(name + " disconnected.");
    }
    if (data.type === "public_key_exchange") {
      console.log(data);
      recipientKey = data.key;
      sharedKeys[data.sender] = await getSharedKey(recipientKey, keys.private);
      if (!recipients.includes(data.sender)) {
        socket.send(
          JSON.stringify({
            type: "public_key_exchange",
            sender: await sha256(senderInput.value.trim()),
            recipient: data.sender,
            key: Number(keys.public),
          })
        );
        recipients.push(data.sender);
        showNotification(`Shared key ${sharedKeys[data.sender]}`);
      } else {
        showNotification(`Shared key ${sharedKeys[data.sender]}`);
      }
      if (funqueue.length > 0) {
        funqueue.shift()();
      }
      return;
    }
    updateTypingNotify(data);
  } else {
    writeLine(data);
  }
});

msg.addEventListener("keydown", (event) => {
  if (event.keyCode === CHAR_RETURN) {
    sendMessage();
  }
});

function updateTypingNotify(data) {
  let sender = data.sender;
  const isSenderTypingDiv = document.getElementById("isSenderTyping");
  if (senderTyping) {
    let name='';
    if (userNames[sender]) {
      name = userNames[sender].displayName;
      if (!name) {
        name = userNames[sender].login;
      }
    } else {
      name = sender;
    }
    isSenderTypingDiv.innerHTML = "Sender " + name + " is typing...";
  } else {
    isSenderTypingDiv.innerHTML = "";
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
async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return crypto.subtle.digest("SHA-256", data).then((buffer) => {
    const hashArray = Array.from(new Uint8Array(buffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  });
}

function generateKeys(params) {
  // Generate a random private key as a Uint8Array
  let privateArray = new Uint8Array(32);
  window.crypto.getRandomValues(privateArray);
  console.log(privateArray);
  // Convert the Uint8Array to a BigInt
  let privateBigInt = arrayToBigInt(privateArray);

  // Calculate the public key
  let public = modPow(
    BigInt(params.generator),
    privateBigInt,
    BigInt(params.prime)
  );

  return { public, private: privateBigInt };
}

// Function to convert a Uint8Array to a BigInt
function arrayToBigInt(array) {
  let result = BigInt(0);
  for (let i = 0; i < array.length; i++) {
    result = (result << 8n) + BigInt(array[i]);
  }
  return result;
}

// Function to calculate modular exponentiation (a^b mod m)
function modPow(base, exponent, modulus) {
  let result = 1n;
  base = base % modulus;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = (result * base) % modulus;
    }
    exponent = exponent >> 1n;
    base = (base * base) % modulus;
  }
  return result;
}

// diffie hellman key exchange
async function getSharedKey(publicKey, privateKey) {
  let key = modPow(BigInt(publicKey), BigInt(privateKey), BigInt(params.prime));
  return await sha256(key.toString());
}

sendButton.addEventListener("click", () => sendMessage());

// Convert hexadecimal key to ArrayBuffer
function hexStringToArrayBuffer(hexString) {
  const bytes = [];
  for (let i = 0; i < hexString.length; i += 2) {
    bytes.push(parseInt(hexString.substr(i, 2), 16));
  }
  return new Uint8Array(bytes).buffer;
}

// Encrypt plaintext data with the encryption key and IV
async function encryptData(plaintext, key) {
  key = await getAESEncryptionKey(key);
  const encodedData = new TextEncoder().encode(plaintext);

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: params.iv, // Use the provided IV
    },
    key,
    encodedData
  );
  return encryptedData;
}

// Decrypt ciphertext data with the encryption key and IV
async function decryptData(ciphertext, key) {
  key = await getAESEncryptionKey(key);
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: params.iv, // Use the same IV used during encryption
    },
    key,
    ciphertext
  );
  return new TextDecoder().decode(decryptedData);
}

function arrayBufferToString(arrayBuffer) {
  const uint8Array = new Uint8Array(arrayBuffer);
  return Array.from(uint8Array).join(" ");
}

// Convert string to ArrayBuffer
function stringToArrayBuffer(string) {
  const numbers = string.split(" ").map(Number);
  const uint8Array = new Uint8Array(numbers);
  return uint8Array.buffer;
}

async function getAESEncryptionKey(key) {
  return await window.crypto.subtle.importKey(
    "raw",
    hexStringToArrayBuffer(key),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

document.getElementById("showWarning").addEventListener("click", function () {
  showNotification("This is a warning notification!", "warning");
});

document.getElementById("showSuccess").addEventListener("click", function () {
  showNotification("This is a success notification!", "success");
});

document.getElementById("showInfo").addEventListener("click", function () {
  showNotification("This is an info notification!", "info");
});

document.getElementById("showDanger").addEventListener("click", function () {
  showNotification("This is a danger notification!", "danger");
});

function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.classList.add("notification", type);

  const content = document.createElement("span");
  content.classList.add("notification-content");
  content.innerText = message;
  notification.appendChild(content);

  const closeBtn = document.createElement("button");
  closeBtn.classList.add("close-btn");
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", function () {
    notification.remove();
  });
  notification.appendChild(closeBtn);

  document.getElementById("notificationContainer").appendChild(notification);

  setTimeout(function () {
    notification.style.display = "block";
    setTimeout(function () {
      notification.classList.add("show");
      setTimeout(function () {
        notification.classList.remove("show");
        setTimeout(function () {
          notification.remove();
        }, 500);
      }, 5000);
    }, 100);
  }, 100);
}

window.addEventListener("beforeunload", function (e) {
  // Cancel the event
  e.preventDefault();

  sendMessage("send_disconnect_notification", ownLoginHash, '', '');
});


function updateUsersList() {
  let usersList = document.getElementById("usersList");
  usersList.innerHTML = "";
  for (let i = 0; i < recipients.length; i++) {
    let user = recipients[i];
    let userElement = document.createElement("div");
    userElement.classList.add("user");
    userElement.innerHTML = userNames[user].login;
    usersList.appendChild(userElement);
  }
}