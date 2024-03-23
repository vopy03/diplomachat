var keys = {};
var sharedKey = 0;
var recipientKey = 0;
var params = "";
var recipients = [];

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
  sender = await sha256(senderInput.value.trim());
  recipient = await sha256(recipientInput.value.trim());
  // if recipient not in list of recipients - send public key
  if (!recipients.includes(recipient)) {
    const payload = JSON.stringify({
      type: "public_key_exchange",
      sender,
      recipient,
      key: Number(keys.public),
    });
    socket.send(payload);
    recipients.push(recipient);
    return;
  }
  message = msg.value.trim();
  writeLine(`You to ${recipientInput.value.trim()}: ${message}`);
  message = await encryptData(message, sharedKey);
  console.log(message);
  message = arrayBufferToString(message);
  console.log(message);
  console.log(stringToArrayBuffer(message))
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
    alert("Please fill in all fields.");
  }
};

// Function to handle setting the sender code
const setSender = async () => {
  const sender = await sha256(senderInput.value.trim());
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
  getPublicVars();
});

socket.addEventListener("close", () => {
  writeLine("closed");
});

socket.addEventListener("message", async ({ data }) => {
  // chack if is JSON string and check if type is "typing"
  if (isJSON(data)) {
    data = JSON.parse(data);
    console.log(data);
    if (data.type === "message") {
      console.log('From ' + data.sender + ': ' + data.message);
      data.message = stringToArrayBuffer(data.message);
      data.message = await decryptData(data.message, sharedKey);
      console.log('From ' + data.sender + ': ' + data.message);
      writeLine('From ' + data.sender + ': ' + data.message)
      return;
    }
    if (data.type === "typing") {
      senderTyping = true;
    } else if (data.type === "stopped typing") {
      senderTyping = false;
    }
    if (data.type === "public_vars") {
      params = data.params;
      keys = generateKeys(params);
      params.iv = hexStringToArrayBuffer(params.iv);
      return;
    }
    if (data.type === "public_key_exchange") {
      console.log(data);
      recipientKey = data.key;
      sharedKey = await getSharedKey(recipientKey, keys.private);
      if(!recipients.includes(data.sender)) {
        socket.send(
          JSON.stringify({
            type: "public_key_exchange",
            sender: await sha256(senderInput.value.trim()),
            recipient: data.sender,
            key: Number(keys.public),
          })
          );
          recipients.push(data.sender);
          writeLine(`Shared key ${sharedKey}`);
        } else {
          writeLine(`Shared key ${sharedKey}`)
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
    isSenderTypingDiv.innerHTML = "Sender " + sender + " is typing...";
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

// Generate a random encryption key
// var key = forge.random.getBytesSync(32); // 256-bit key

// Message to encrypt
// var message = "Hello, Forge!";

// // Encrypt the message
// var encryptedMessage = encryptMessage(message, key);
// console.log("Encrypted Message:", encryptedMessage);

// // Decrypt the message
// var decryptedMessage = decryptMessage(encryptedMessage, key);
// console.log("Decrypted Message:", decryptedMessage);

// // Function to encrypt a message using AES
// function encryptMessage(message, key) {
//   var cipher = forge.cipher.createCipher("AES-CBC", key);
//   cipher.start({ iv: forge.random.getBytesSync(16) });
//   cipher.update(forge.util.createBuffer(message, "utf8"));
//   cipher.finish();
//   return forge.util.encode64(cipher.output.getBytes());
// }

// // Function to decrypt a message using AES
// function decryptMessage(encryptedMessage, key) {
//   try {
//     var decipher = forge.cipher.createDecipher("AES-CBC", key);
//     decipher.start({ iv: forge.random.getBytesSync(16) });
//     decipher.update(forge.util.createBuffer(encryptedMessage, "base64")); // Use 'base64' encoding
//     decipher.finish();
//     return decipher.output.toString("utf8");
//   } catch (error) {
//     console.error("Error decrypting message:", error);
//     return null; // Handle decryption error gracefully
//   }
// }

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
  key = await getAESEncryptionKey(key)
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
  key = await getAESEncryptionKey(key)
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

// Convert an ArrayBuffer to a string of numbers
function arrayBufferToNumberString(arrayBuffer) {
  const uint8Array = new Uint8Array(arrayBuffer);
  return Array.from(uint8Array).join(" ");
}

// Convert a string of numbers to an ArrayBuffer
function numberStringToArrayBuffer(numberString) {
  
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

// Example usage
// Example usage
// (async () => {
//   // Define the encryption key
//   const keyHex = "b9b21209718fdb250df368efdb120747586fd5679ae76f9789bef89339df1737";
//   const encryptionKey = await getAESEncryptionKey(keyHex)


//   // Example plaintext
//   const plaintext = "Hello, world!";

//   // Encrypt plaintext
//   const ciphertext = await encryptData(plaintext, encryptionKey);
//   console.log("Encrypted:", ciphertext);

//   // Decrypt ciphertext
//   const decryptedText = await decryptData(ciphertext, encryptionKey);
//   console.log("Decrypted:", decryptedText);
// })();.