import Recipient from "./Recipient.js";
import Encryptor from "./Encryptor.js";
import Tools from "./Tools.js";
import DiffieHellman from "./DiffieHellman.js";
import User from "./User.js";
import DOM from "./DOM.js";
import App from "./App.js";

class Message {
  static messages = [];
  static isUserCheckSended = false;

  constructor(
    sender,
    recipient,
    content = "",
    id = window.crypto.randomUUID(),
    attachments = [],
    reactions = [],
    date = Date.now(),
    seen = false
  ) {
    this.sender = sender;
    this.recipient = recipient;
    this.content = content;
    this.id = id;
    this.attachments = attachments;
    this.reactions = reactions;
    this.date = date;
    this.seen = seen;
    this.encryptedContent = "";
  }

  static init() {
    socket.addEventListener("message", async ({ data }) => {
      if (Tools.isJSON(data)) {
        data = JSON.parse(data);
        console.log(data);
        if (data.type === "message") {
          this.handleMessage(data);
        }
        if (data.type === "reaction") {
          this.handleReaction(data);
        }
        if (data.type === "disconnect_notification") {
          this.handleDisconnectNotification(data);
        }
        if (data.type === "public_key_exchange") {
          this.handlePublicKeyExchange(data);
        }
        if (data.type === "set_sender") {
          this.handleSetSender(data);
        }
        if (data.type === "public_vars") {
          this.handlePublicVars(data);
        }
        if (data.type === "typing") {
          this.handleTyping(data);
        }
        if (data.type === "stop_typing") {
          this.handleStopTyping(data);
        }
        if (data.type === "user_online") {
          this.handleUserOnline(data);
        }
      }
    });
  }
  static async sendMessage() {
    let sender;

    if (socket.readyState !== WebSocket.OPEN) {
      Tools.showNotification(
        "Connection to websocket is closed. Reload page to use ClearTalk.",
        "error"
      );

      DOM.elems.msg.value = "";
      DOM.elems.fileInput.value = "";

      let attachmentsBlock = DOM.get(".chat-section-bottom #attachments-block");
      if (attachmentsBlock) {
        attachmentsBlock.innerHTML = "";
      }
      return;
    }
    if (User.hashName) {
      sender = User.hashName;
    } else {
      sender = await Tools.sha256(DOM.elems.senderInput.value.trim());
    }
    let recipient = await Tools.sha256(DOM.elems.recipientInput.value.trim());
    if (sender == recipient) {
      Tools.showNotification(
        "You can't send a message to yourself!",
        "warning"
      );
      return;
    }
    // if recipient not in list of recipients - send public key
    if (!DiffieHellman.sharedKeys[recipient]) {
      const payload = JSON.stringify({
        type: "public_key_exchange",
        sender,
        recipient,
        key: Number(DiffieHellman.publicKey),
      });
      socket.send(payload);
      App.funqueue.push(Tools.wrapFunctionQueue(this.sendMessage, this));
      return;
    }
    let messageObj = Message.fromText(
      DOM.elems.msg.value.trim(),
      recipient,
      User.hashName
    );
    console.log(messageObj);
    // console.log(message);
    let attachments = [];
    if (DOM.elems.fileInput.files.length > 0) {
      for (let i = 0; i < DOM.elems.fileInput.files.length; i++) {
        let fileData = await Tools.readFileAsArrayBuffer(
          DOM.elems.fileInput.files[i]
        );
        let base64Data = Tools.arrayBufferToBase64(fileData);
        attachments.push({
          fileName: DOM.elems.fileInput.files[i].name,
          fileType: DOM.elems.fileInput.files[i].type,
          fileSize: DOM.elems.fileInput.files[i].size,
          fileData: base64Data,
        });
      }
      // let file = DOM.elems.fileInput.files[0];
      // let fileData = await Tools.readFileAsArrayBuffer(file);
      // let base64Data = Tools.arrayBufferToBase64(fileData);
      // attachments.push({
      //   fileName: file.name,
      //   fileType: file.type,
      //   fileData: base64Data,
      // });
    }
    messageObj.attachments = attachments;
    if (!messageObj.content && !messageObj.attachments.length) {
      return;
    }
    let message = JSON.stringify({
      sender: User.login,
      displayName: User.displayName,
      message: messageObj,
    });
    // DOM.writeLine(`You to ${DOM.elems.recipientInput.value.trim()}: ${message}`);
    DOM.displayMessageInChat(messageObj);
    message = await Encryptor.encrypt(
      message,
      DiffieHellman.sharedKeys[recipient]
    );
    console.log(message);
    message = Tools.arrayBufferToBase64(message);
    console.log(message);
    // console.log(stringToArrayBuffer(message));
    if (sender && recipient && message) {
      const payload = JSON.stringify({
        type: "message",
        sender,
        recipient,
        message,
      });
      console.log(payload);
      socket.send(payload);
      DOM.elems.msg.value = "";
      DOM.elems.fileInput.value = "";

      let attachmentsBlock = DOM.get(".chat-section-bottom #attachments-block");
      if (attachmentsBlock) {
        attachmentsBlock.innerHTML = "";
      }
    } else {
      Tools.showNotification("Please fill in all fields.");
    }

    this.messages.push(messageObj);

    return message;
  }
  static fromJSON(json) {
    return new Message(
      json.sender,
      json.recipient,
      json.content ? json.content : "",
      json.id ? json.id : window.crypto.randomUUID(),
      json.attachments ? json.attachments : [],
      json.reactions ? json.reactions : [],
      json.date ? json.date : Date.now()
    );
  }
  static fromText(text, recipient, sender = User.hashName) {
    return new Message(sender, recipient, text);
  }
  static toJSON(message) {
    return {
      type: "message",
      sender: message.sender,
      recipient: message.recipient,
      message: message.content,
      id: message.id,
      attachments: message.attachments,
      reactions: message.reactions,
      date: message.date,
    };
  }
  setReaction(user, reaction) {
    if (this.reactions.find((r) => r.user === user)) {
      this.reactions = this.reactions.filter((r) => r.user !== user);
    }
    this.reactions.push({ user, reaction });
  }
  getDate() {
    return new Date(this.date).toLocaleString();
  }
  send() {
    return Message.sendMessage(this);
  }
  async encrypt(key) {
    let plaintext = JSON.stringify(Message.toJSON(this));
    this.encryptedContent = await Encryptor.encrypt(plaintext, key);
  }
  async decrypt(key, message = this.getEncryptedMessage()) {
    let plaintext = await Encryptor.decrypt(message, key);
    return JSON.parse(plaintext);
  }
  async getEncryptedMessage() {
    if (!this.encryptedContent) {
      await this.encrypt();
    }
    return this.encryptedContent;
  }

  static async sendTechnicalMessage(
    type,
    recipient = null,
    params = [],
    sender = User.hashName
  ) {
    if (!recipient) {
      socket.send(JSON.stringify({ type, sender, ...params }));
    } else {
      socket.send(JSON.stringify({ type, sender, recipient, ...params }));
    }
    return;
  }

  static async handleMessage(data) {
    data.message = Tools.base64ToArrayBuffer(data.message);
    data.message = await Encryptor.decrypt(
      data.message,
      DiffieHellman.sharedKeys[data.sender]
    );
    let message = "";
    console.log(data.message);
    if (Tools.isJSON(data.message)) {
      message = JSON.parse(data.message);
      Recipient.getByHashName(data.sender).login = message.sender;
      Recipient.getByHashName(data.sender).displayName = message.displayName;
      console.log(message);
      message = Message.fromJSON(message.message);
      // if (message.attachments.length) {
      //   for (let i = 0; i < message.attachments.length; i++) {
      //     Tools.handleReceivedFile(
      //       message.attachments[i].fileData,
      //       message.attachments[i].fileName,
      //       message.attachments[i].fileType
      //     );
      //   }
      // }
      let senderName = Recipient.getName(data.sender);
      console.log(message);
      console.log("From " + senderName + ": " + message.content);
      Recipient.getByHashName(data.sender).isOnline = true;

      DOM.displayMessageInChat(message);
      DOM.updateUserTypingMessage(Recipient.getByHashName(data.sender));

      Message.messages.push(message);
      DOM.updateUserList();
    }

    return;
  }
  static handleReaction(data) {
    this.setReaction(data.sender, data.reaction);
    return;
  }
  static handleDisconnectNotification(data) {
    if (Recipient.isRecipientIsset(data.sender)) {
      Tools.showNotification(`${Recipient.getName(data.sender)} disconnected`);
      DiffieHellman.sharedKeys[data.sender] = null;
      Recipient.getByHashName(data.sender).isOnline = false;
      Recipient.getByHashName(data.sender).publicKey = 0;
      DOM.updateUserList();
    }
  }
  static async handlePublicKeyExchange(data) {
    console.log(data);
    // recipientKey = data.key;
    if (data.status) {
      DiffieHellman.sharedKeys[data.sender] = await DiffieHellman.getSharedKey(
        data.key,
        DiffieHellman.privateKey
      );
      // console.log(!Recipient.isRecipientIsset(data.sender));
      if (
        !Recipient.isRecipientIsset(data.sender) ||
        !Recipient.getByHashName(data.sender).publicKey
      ) {
        socket.send(
          JSON.stringify({
            type: "public_key_exchange",
            sender: User.hashName,
            recipient: data.sender,
            key: Number(DiffieHellman.publicKey),
          })
        );
        Recipient.getByHashName(data.sender).setPublicKey(data.key);
        Recipient.getByHashName(data.sender).isOnline = true;
        // console.log(Recipient.getByHashName(data.sender));
        // Tools.showNotification(
        //   `Shared key ${DiffieHellman.sharedKeys[data.sender]}`
        // );
      } else {
        // Tools.showNotification(
        //   `Shared key ${DiffieHellman.sharedKeys[data.sender]}`
        // );
      }
      if (App.funqueue.length > 0) {
        App.funqueue.shift()();
      }
    } else {
      App.funqueue = [];
      Tools.showNotification(
        `Recipient ${DOM.elems.recipientInput.value} not found or not connected.`,
        "warning"
      );
      DOM.elems.recipientInput.value = "";
      Recipient.remove(data.sender);
    }
  }
  static handleSetSender(data) {
    if (data.status) {
      User.hashName = data.sender;
      User.login = DOM.elems.senderInput.value.trim();
      User.displayName = DOM.elems.displayName.value.trim();
      User.isServerApproved = true;
      DOM.toggleTab("main-tab");
      DOM.setUserInfoToStatusBar();
      // Tools.showNotification(data.message);
    } else {
      DOM.elems.setSenderButton.disabled = false;
      DOM.elems.senderInput.disabled = false;
      Tools.showNotification(data.message, "danger");
    }
  }
  static handlePublicVars(data) {
    let params = data.params;
    DiffieHellman.prime = params.prime;
    DiffieHellman.generator = params.generator;
    DiffieHellman.generateKeys();

    Encryptor.iv = Tools.hexStringToArrayBuffer(params.iv);
  }
  static handleTyping(data) {
    console.log(data);
    if (Recipient.isRecipientIsset(data.sender)) {
      let recipient = Recipient.getByHashName(data.sender);
      recipient.changeTypingStatus(true);
      DOM.updateUserTypingMessage(recipient);
    }
  }
  static handleStopTyping(data) {
    if (Recipient.isRecipientIsset(data.sender)) {
      let recipient = Recipient.getByHashName(data.sender);
      recipient.changeTypingStatus(false);
      DOM.updateUserTypingMessage(recipient);
    }
  }
  static handleUserOnline(data) {
    console.log(data);
    if (data.status) {
      DOM.elems.addUserBtn.disabled = false;
      if (DOM.get(".modal-body.add-user .alert")) {
        DOM.get(".modal-body.add-user .alert").remove();
      }
      let alert = document.createElement("div");
      alert.classList.add("alert", "alert-success");
      alert.innerHTML = `User ${DOM.elems.addUserInput.value} is online!`;
      DOM.get(".modal-body.add-user").appendChild(alert);
    } else {
      DOM.elems.addUserBtn.disabled = true;
      // add alert that user dont isset
      if (DOM.elems.addUserInput.value.trim()) {
        let alert = document.createElement("div");
        alert.classList.add("alert", "alert-danger");
        alert.innerHTML = `User ${DOM.elems.addUserInput.value} not found or offline`;
        DOM.get(".modal-body.add-user").appendChild(alert);
      }
    }
  }

  static async sendTypingNotification() {
    User.isTyping = true;
    let sender;
    if (User.hashName) {
      sender = User.hashName;
    } else {
      sender = await Tools.sha256(DOM.elems.senderInput.value.trim());
    }
    const recipient = await Tools.sha256(DOM.elems.recipientInput.value.trim());
    const message = "typing";
    socket.send(
      JSON.stringify({
        type: "typing",
        sender,
        recipient,
        message,
      })
    );
  }

  static async sendStoppedTypingNotification() {
    User.isTyping = false;
    let sender;
    if (User.hashName) {
      sender = User.hashName;
    } else {
      sender = await Tools.sha256(DOM.elems.senderInput.value.trim());
    }
    const recipient = await Tools.sha256(DOM.elems.recipientInput.value.trim());
    const message = "stop_typing";
    socket.send(
      JSON.stringify({
        type: "stop_typing",
        sender,
        recipient,
        message,
      })
    );
  }
  static async sendUserOnlineCheck() {
    this.isUserCheckSended = true;
    let recipient = await Tools.sha256(DOM.elems.addUserInput.value.trim());

    socket.send(
      JSON.stringify({
        type: "user_online",
        recipient,
      })
    );
  }
}

export default Message;
