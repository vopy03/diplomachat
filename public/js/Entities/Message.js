import Recipient from "./Recipient.js";
import Encryptor from "./Encryptor.js";
import Tools from "./Tools.js";
import DiffieHellman from "./DiffieHellman.js";
import User from "./User.js";
import DOM from "./DOM.js";
import App from "./App.js";

class Message {
  static messages = [];

  constructor(
    sender,
    recipient,
    content = "",
    id = window.crypto.randomUUID(),
    attachments = [],
    reactions = [],
    date = Date.now(),
    senderInfo = { login: User.login, displayName: User.displayName }
  ) {
    this.sender = sender;
    this.recipient = recipient;
    this.content = content;
    this.id = id;
    this.attachments = attachments;
    this.reactions = reactions;
    this.date = date;
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
      }
    });
  }
  static async sendMessage() {
    let sender;
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
    if (!Recipient.isRecipientIsset(recipient)) {
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
      let file = DOM.elems.fileInput.files[0];
      let fileData = await Tools.readFileAsArrayBuffer(file);
      let base64Data = Tools.arrayBufferToBase64(fileData);
      attachments.push({
        fileName: file.name,
        fileType: file.type,
        fileData: base64Data,
      });
    }
    messageObj.attachments = attachments;
    let message = JSON.stringify({
      sender: User.login,
      displayName: User.displayName,
      message: messageObj,
    });
    DOM.writeLine(`You to ${DOM.elems.recipientInput.value.trim()}: ${message}`);
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
        type: 'message',
        sender,
        recipient,
        message,
      });
      console.log(payload);
      socket.send(payload);
      DOM.elems.msg.value = "";
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
      if (message.attachments.length) {
        for (let i = 0; i < message.attachments.length; i++) {
          Tools.handleReceivedFile(
            message.attachments[i].fileData,
            message.attachments[i].fileName,
            message.attachments[i].fileType
          );
        }
      }
      let senderName = Recipient.getName(data.sender);
      console.log(message);
      console.log("From " + senderName + ": " + message.content);
      DOM.writeLine("From " + senderName + ": " + message.content);

      Message.messages.push(message);
    }

    return;
  }
  static handleReaction(data) {
    this.setReaction(data.sender, data.reaction);
    return;
  }
  static handleDisconnectNotification(data) {
    Tools.showNotification(`${Recipient.getName(data.sender)} disconnected`);
    Recipient.remove(data.sender);
  }
  static async handlePublicKeyExchange(data) {
    console.log(data);
    // recipientKey = data.key;

    DiffieHellman.sharedKeys[data.sender] = await DiffieHellman.getSharedKey(
      data.key,
      DiffieHellman.privateKey
    );
    if (!Recipient.isRecipientIsset(data.sender)) {
      socket.send(
        JSON.stringify({
          type: "public_key_exchange",
          sender: User.hashName,
          recipient: data.sender,
          key: Number(DiffieHellman.publicKey),
        })
      );
      Recipient.getByHashName(data.sender).setPublicKey(data.key);
      Tools.showNotification(
        `Shared key ${DiffieHellman.sharedKeys[data.sender]}`
      );
    } else {
      Tools.showNotification(
        `Shared key ${DiffieHellman.sharedKeys[data.sender]}`
      );
    }
    if (App.funqueue.length > 0) {
      App.funqueue.shift()();
    }
  }
  static handleSetSender(data) {
    Tools.showNotification(data.message);
    if (data.status) {
      User.hashName = data.sender;
      User.login = DOM.elems.senderInput.value.trim();
      User.displayName = DOM.elems.displayName.value.trim();
      User.isServerApproved = true;
    } else {
      DOM.elems.setSenderButton.disabled = false;
      DOM.elems.senderInput.disabled = false;
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
    if(Recipient.isRecipientIsset(data.sender)) {
      Recipient.getByHashName(data.sender).changeTypingStatus(true);
    }
  }
  static handleStopTyping(data) {
    if(Recipient.isRecipientIsset(data.sender)) {
      Recipient.getByHashName(data.sender).changeTypingStatus(false);
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
}

export default Message;
