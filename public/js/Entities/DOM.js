import User from "./User.js";
import Message from "./Message.js";

class DOM {
  static elems = {};

  static init() {
    this.elems.chat = document.getElementById("chat");
    this.elems.senderInput = document.getElementById("sender");
    this.elems.displayName = document.getElementById("displayName");
    this.elems.setSenderButton = document.getElementById("setSender");
    this.elems.recipientInput = document.getElementById("recipient");
    this.elems.fileInput = document.getElementById("file-input");
    this.elems.msg = document.getElementById("msg");
    this.elems.sendButton = document.getElementById("sendButton");

    this.elems.tabs = document.querySelectorAll(".ct-tab");

    this.elems.tabs.forEach((tab) => {
      tab.classList.remove('active')
    })
    this.toggleTab('sender-set-tab')

    this.initHandlers();
  }

  static toggleTab(tabName) {
    this.elems.tabs.forEach((tab) => {
      if (tab.classList.contains(tabName)) {
        tab.classList.add('active')
      } else {
        tab.classList.remove('active')
      }
    })
  }

  static initHandlers() {
    this.elems.setSenderButton.addEventListener("click", () => {
      User.setSender();
    });
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

    this.elems.msg.addEventListener("input", () => {
      if (!User.isTyping) {
        Message.sendTypingNotification();
      }
      clearTimeout(TOStopTyping);
      TOStopTyping = setTimeout(() => {
        Message.sendStoppedTypingNotification();
      }, 1000);
    });

    // this.elems.msg.addEventListener("keydown", (event) => {
    //   if (event.keyCode === CHAR_RETURN) {
    //     sendMessage();
    //   }
    // });

    this.elems.sendButton.addEventListener("click", () => {
      Message.sendMessage();
    });
  }
  static writeLine(text) {
    const line = document.createElement("div");
    line.innerHTML = `<p>${text}</p>`;
    this.elems.chat.appendChild(line);
  }
  static get(selector) {
    return document.querySelector(selector);
  }
  static getAll(selector) {
    return document.querySelectorAll(selector);
  }

  static displayMessageInChat(message) {
    const line = document.createElement("div");
    let sender = Recipient.getName(message.sender);
    let login = Recipient.getByHashName(message.sender).login;
    if(message.sender === User.hashName) {
      sender = User.getName();
      login = User.login;
    }
    line.innerHTML = `<div>
      <p>${sender}: ${message.content}</p>
      <small>${login}</small>
    </div>
    `;
    this.elems.chat.appendChild(line);
  }
}

export default DOM;
