import Message from "./Message.js";
import User from "./User.js";

class Recipient {
  static recipients = [];

  constructor(hashName, login = "", displayName = "") {
    this.hashName = hashName;
    this.login = login;
    this.displayName = displayName;
    this.publicKey = 0;
    this.isTyping = false;
    this.isOnline = true;
    this.bgcolor = '#333';
  }
  static add(hashName, login = "", displayName = "") {
    if (!Recipient.isRecipientIsset(hashName) && hashName && User.hashName != hashName) {
      let recipient = new Recipient(hashName, login, displayName);
      recipient.bgcolor = this.getRandomColor();
      Recipient.recipients.push(recipient);
    }
    // if(Recipient.isRecipientIsset(User.hashName)) {
    //   Recipient.remove(User.hashName);
    // }
    DOM.updateUserList()
  }
  static remove(hashName) {
    Recipient.recipients = Recipient.recipients.filter(
      (recipient) => recipient.hashName !== hashName
    );
    DOM.updateUserList()
  }
  remove() {
    Recipient.remove(this.hashName);
  }
  static getByHashName(hashName) {
    if (!Recipient.isRecipientIsset(hashName)) {
      Recipient.add(hashName, DOM.elems.addUserInput.value);
    }
    return Recipient.recipients.find(
      (recipient) => recipient.hashName === hashName
    );
  }
  static getLogin(hashName) {
    return Recipient.getByHashName(hashName).login;
  }
  static getDisplayName(hashName) {
    return Recipient.getByHashName(hashName).displayName;
  }
  static getName(hashName) {
    if (Recipient.getByHashName(hashName).displayName) {
      return Recipient.getByHashName(hashName).displayName;
    }
    if (Recipient.getByHashName(hashName).login) {
      return Recipient.getByHashName(hashName).login;
    }
    return hashName;
  }
  getName() {
    if (this.displayName) {
      return this.displayName;
    }
    if (this.login) {
      return this.login;
    }
    return this.hashName;
  }
  setPublicKey(publicKey) {
    this.publicKey = publicKey;
  }
  static getRecipients() {
    return Recipient.recipients;
  }

  changeTypingStatus(status) {
    this.isTyping = status;
    console.log(this);
  }

  async sendMessage(message) {
    // if message typeof Message
    if (message.constructor.name !== "Message") {
      message = Message.fromJSON(message);
    }
    // send message to server
    message.send();
  }
  static isRecipientIsset(hashName) {
    if (
      Recipient.recipients.find((recipient) => recipient.hashName === hashName)
    ) {
      return true;
    } else {
      return false;
    }
  }
  static isRecipientIssetByLogin(login) {
    if (
      Recipient.recipients.find((recipient) => recipient.login === login)
    ) {
      return true;
    } else {
      return false;
    }
  }
  static getAllRecipientHashNames() {
    return this.recipients.map((recipient) => recipient.hashName);
  }

  static getRandomColor() {
    // Generate random values for red, green, and blue components
    var r = Math.floor(Math.random() * 6) + 3; // Random value between 3 and 8
    var g = Math.floor(Math.random() * 6) + 3;
    var b = Math.floor(Math.random() * 6) + 3;

    // Convert values to hexadecimal and concatenate them to form the color code
    var color = "#" + r +g + b;

    return color;
}

  
}

export default Recipient;
