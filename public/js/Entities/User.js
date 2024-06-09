import DOM from "./DOM.js";
import Tools from "./Tools.js";

class User {
  static hashName = "";
  static login;
  static displayName;
  static isServerApproved = false;
  static isTyping = false;

  static setHashName(hashName) {
    this.hashName = hashName;
    User.bgColor = Tools.getRandomColor();
  }
  static setLogin(login) {
    this.login = login;
  }

  static async setSender() {
    // if sender is empty or has 3 or less symbols
    let sender = DOM.elems.senderInput.value.trim();
    if (!sender || sender.length < 3) {
      Tools.showNotification("Please enter a valid login name. (minimal length 3 symbols)", "warning");
      return;
    }
    sender = await Tools.sha256(DOM.elems.senderInput.value.trim());
    if (sender) {
      const payload = JSON.stringify({ type: "set_sender", sender });
      socket.send(payload);
      // DOM.elems.senderInput.disabled = true;
      // DOM.elems.setSenderButton.disabled = true;
      // DOM.elems.senderInput.classList.add("disabled");
      // DOM.elems.setSenderButton.classList.add("disabled");
      // Tools.showNotification(`Sender code set: ${sender}`);
    } else {
      Tools.showNotification("Please enter a valid sender code.");
    }
  }

  static getSettings() {
    let passwordRequired = false;
    if(DOM.get("#passwordSetting").checked && DOM.get('#userPassword').trim()) {
      passwordRequired = true;
    }
    return { passwordRequired };
  }
  static checkPassword(password) {
    return password === DOM.get("#userPassword").value;
  }

  static getName() {
    if (this.displayName) {
      return this.displayName;
    }
    if (this.login) {
      return this.login;
    }
    return this.hashName;
  }
}

export default User;
