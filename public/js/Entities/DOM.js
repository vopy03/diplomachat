import User from "./User.js";
import Message from "./Message.js";
import Recipient from "./Recipient.js";

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
    this.elems.usersList = document.getElementById("usersList");

    this.elems.tabs = document.querySelectorAll(".ct-tab");

    this.elems.tabs.forEach((tab) => {
      tab.classList.remove("active");
    });
    this.toggleTab("sender-set-tab");

    this.initHandlers();
  }

  static toggleTab(tabName) {
    this.elems.tabs.forEach((tab) => {
      if (tab.classList.contains(tabName)) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });
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
    let sender;
    let login;
    if (message.sender === User.hashName) {
      sender = User.getName();
      login = User.login;
    } else {
      sender = Recipient.getName(message.sender);
      login = Recipient.getByHashName(message.sender).login;
    }
    line.innerHTML = `<div>
      <p>${sender}: ${message.content}</p>
      <small>${login}</small>
    </div>
    `;
    this.elems.chat.appendChild(line);
  }

  static getRecipientUserListItem(recipient) {
    let loginhtml ='';
    if(recipient.displayName) {
      loginhtml = '<span class="fs-6">'+recipient.login+'</span>';
    } 
    let html = 
    '<div class="user d-flex p-2" data-user-id="'+recipient.id+'">'+
      '<div class="user-avatar-container p-2">'+
        '<i class="user-avatar rounded-circle" data-letter="'+recipient.getName().charAt(0)+
        '" style="background-color:'+recipient.bgcolor+'"></i>'+
      '</div>'+
      '<div class="d-flex flex-column justify-content-center">'+
        '<span class="fs-5">'+recipient.getName()+'</span>' + loginhtml
      '</div>'+
    '</div>';
    return html;
  }

  static updateUserList() {
    this.elems.usersList.innerHTML = "";
    Recipient.recipients.forEach((recipient) => {
      this.elems.usersList.innerHTML +=
        this.getRecipientUserListItem(recipient);
        console.log(this.getRecipientUserListItem(recipient))
    });
  }
}

export default DOM;
