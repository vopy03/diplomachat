class Message {
  static messages = [];

  constructor(
    id,
    sender,
    recipient,
    content = '',
    attachments = [],
    reactions = [],
    date = Date.now()
  ) {
    this.id = id;
    this.sender = sender;
    this.recipient = recipient;
    this.content = content;
    this.attachments = attachments;
    this.reactions = reactions;
    this.date = date;
  }
  static async sendMessage(message) {

    this.messages.push(message);
  }
  static fromJSON(json) {
    return new Message(
      global.crypto.randomUUID(),
      json.sender,
      json.recipient,
      json.message ? json.message : '',
      json.attachments ? json.attachments : [],
      json.reactions ? json.reactions : [],
      json.date ? json.date : Date.now()
    );
  }
  static toJSON(message) {
    return {
      id: message.id,
      type: 'message',
      sender: message.sender,
      recipient: message.recipient,
      message: message.content,
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
}
