class Message {
  static messages = [];

  constructor(
    sender,
    recipient,
    content = "",
    id = global.crypto.randomUUID(),
    attachments = [],
    reactions = [],
    date = Date.now()
  ) {
    this.sender = sender;
    this.recipient = recipient;
    this.content = content;
    this.id = id;
    this.attachments = attachments;
    this.reactions = reactions;
    this.date = date;
    this.encryptedContent = "";

    socket.addEventListener("message", async ({ data }) => {
      if (isJSON(data)) {
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
  static async sendMessage(message) {
    this.messages.push(message);
    return message;
  }
  static fromJSON(json) {
    return new Message(
      json.sender,
      json.recipient,
      json.message ? json.message : "",
      global.crypto.randomUUID(),
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
    if(!recipient) {
      socket.send(JSON.stringify({ type, sender,  ...params }));
    }
    else {
      socket.send(JSON.stringify({ type, sender, recipient, ...params }));
    }
    return;
  }

  static async handleMessage() {
      data.message = base64ToArrayBuffer(data.message);
      data.message = await Encryptor.decrypt(data.message, DiffieHellman.sharedKeys[data.sender]);
      let message = "";
      console.log(data.message);
      if (isJSON(data.message)) {
        message = JSON.parse(data.message);
        Recipient.getByHashName(data.sender).login = message.sender;
        Recipient.getByHashName(data.sender).displayName = message.displayName;
        console.log(message);
        message = Message.fromJSON(message.message);
        if (message.attachments.length) {
          for (let i = 0; i < message.attachments.length; i++) {
            handleReceivedFile(
              message.attachments[i].fileData,
              message.attachments[i].fileName,
              message.attachments[i].fileType
            );
          }
        }
        let senderName = Recipient.getName(data.sender);
        console.log(message);
        console.log("From " + senderName + ": " + message.content);
        writeLine("From " + senderName + ": " + message.content);
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
    recipientKey = data.key;
    Recipient.getByHashName(data.sender).changePublicKey(data.key);
    DiffieHellman.sharedKeys[data.sender] = await Tools.getSharedKey(
      recipientKey,
      DiffieHellman.privateKey
    );
    if (Recipient.isRecipientIsset(data.sender)) {
      socket.send(
        JSON.stringify({
          type: "public_key_exchange",
          sender: User.hashName,
          recipient: data.sender,
          key: Number(DiffieHellman.publicKey),
        })
      );
      Recipient.add(data.sender);
      Tools.showNotification(
        `Shared key ${DiffieHellman.sharedKeys[data.sender]}`
      );
    } else {
      Tools.showNotification(
        `Shared key ${DiffieHellman.sharedKeys[data.sender]}`
      );
    }
  }
  static handleSetSender(data) {
    Tools.showNotification(data.message);
    if (data.status) {
      User.isServerApproved = true;
    } else {
      setSenderButton.disabled = false;
      senderInput.disabled = false;
    }
  }
  static handlePublicVars(data) {
    let params = data.params;
    DiffieHellman.prime = params.prime;
    DiffieHellman.generator = params.generator;
    DiffieHellman.generateKeys();

    Encryptor.iv = params.iv;
  }
  static handleTyping(data) {
    Recipient.getByHashName(data.recipient).changeTypingStatus(true);
  }
  static handleStopTyping() {
    Recipient.getByHashName(data.recipient).changeTypingStatus(false);
  }
}
