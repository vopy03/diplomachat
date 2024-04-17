import Message from "./Message.js";

class Recipient {
  static recipients = [];

  constructor(hashName, login = "", displayName = "") {
    this.hashName = hashName;
    this.login = login;
    this.displayName = displayName;
    this.publicKey = "";
    this.isTyping = false;
  }
  static add(hashName, login = "", displayName = "") {
    if(!Recipient.isRecipientIsset(hashName) && hashName) {
      Recipient.recipients.push(new Recipient(hashName, login, displayName));
    }
  }
  static remove(hashName) {
    Recipient.recipients = Recipient.recipients.filter(
      (recipient) => recipient.hashName !== hashName
    );
  }
  remove() {
    Recipient.remove(this.hashName);
  }
  static getByHashName(hashName) {
    if (!Recipient.isRecipientIsset(hashName)) {
      Recipient.add(hashName);
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
  setPublicKey(publicKey) {
    this.publicKey = publicKey;
  }
  static getRecipients() {
    return Recipient.recipients;
  }

  changeTypingStatus(status) {
    this.isTyping = status;
    console.log(this)
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
    if(Recipient.recipients.find((recipient) => recipient.hashName === hashName)) {
      return true;
    } else {
      return false;
    }
  }
  static getAllRecipientHashNames() {
    return this.recipients.map((recipient) => recipient.hashName);
  }
}


export default Recipient;