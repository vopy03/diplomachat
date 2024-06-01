import User from "./User.js";
import Message from "./Message.js";
import Recipient from "./Recipient.js";
import Tools from "./Tools.js";

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
    this.elems.addUserBtn = document.getElementById("add-user-btn");
    this.elems.addUserInput = document.getElementById("add-user-input");

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

    // on enter send message
    this.elems.msg.addEventListener("keydown", (event) => {
      event.target.style.height = "auto"; // Reset the height to auto
      event.target.style.height = event.target.scrollHeight + "px"; // Set the height to the scroll height

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.elems.sendButton.click();
      }
    });

    this.elems.fileInput.addEventListener("change", (event) => {
      // check every file
      let attahmentsSize = 0;
      for (let i = 0; i < event.target.files.length; i++) {
        let file = event.target.files[i];
        if (file) {
          attahmentsSize += file.size;
        }
      }
      console.log(attahmentsSize);
      // set limit
      if (attahmentsSize > 10 * 1024 * 1024) {
        Tools.showNotification(
          "Size of attachments is too big (Max: 10MB)",
          "danger"
        );
        this.elems.fileInput.value = "";
      }
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

    this.elems.addUserInput.addEventListener("input", () => {
      Message.isUserCheckSended = false;
      this.elems.addUserBtn.disabled = true;
      if (DOM.get(".modal-body.add-user .alert")) {
        DOM.get(".modal-body.add-user .alert").remove();
      }
      clearTimeout(TOCheckUserOnline);
      if (this.elems.addUserInput.value == User.login) {
        let alert = document.createElement("div");
        alert.classList.add("alert", "alert-warning");
        alert.innerHTML = `You can't add yourself`;
        DOM.get(".modal-body.add-user").appendChild(alert);
        return;
      }
      if (
        Recipient.isRecipientIssetByLogin(this.elems.addUserInput.value.trim())
      ) {
        let alert = document.createElement("div");
        alert.classList.add("alert", "alert-warning");
        alert.innerHTML = `User is already added`;
        DOM.get(".modal-body.add-user").appendChild(alert);
        return;
      }
      TOCheckUserOnline = setTimeout(() => {
        if (
          DOM.elems.addUserInput.value.trim() &&
          this.elems.addUserInput.value != User.login
        ) {
          Message.sendUserOnlineCheck();
        }
      }, 500);
    });
    this.elems.addUserBtn.addEventListener("click", async () => {
      let hashName = await Tools.sha256(this.elems.addUserInput.value.trim());
      Recipient.add(hashName, this.elems.addUserInput.value.trim());
      this.updateUserList();
      // close modal
      DOM.get('#exampleModal [data-bs-dismiss="modal"]').click();
      this.elems.addUserInput.value = "";
      this.elems.addUserBtn.disabled = true;
      if (DOM.get(".modal-body.add-user .alert")) {
        DOM.get(".modal-body.add-user .alert").remove();
      }
      // click to new added user
      DOM.get(`[data-user-id="${hashName}"]`).click();
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

  static async displayMessageInChat(message) {
    console.log(message);
    this.createChatTabs();
    const line = document.createElement("div");
    line.classList.add("message");
    line.setAttribute("data-message-id", message.id);
    if (message.sender === User.hashName) {
      line.classList.add("self-message");
      line.innerHTML = `<div class='message-content'>
      <p>${message.content}</p>
      </div>
      <br>
    `;
    } else {
      let sender = Recipient.getByHashName(message.sender);
      line.innerHTML = `<div class="user-avatar-container align-self-baseline position-relative p-2">
      <i class="user-avatar rounded-circle" data-letter="${sender
        .getName()
        .charAt(0)}" style="background-color:${sender.bgcolor}"></i>
      </div>
      <div class='message-content'>
      <p>${message.content}</p>
      </div>
      <br>
    `;
    }

    let chatTab;
    if (message.sender == User.hashName) {
      chatTab = this.elems.chat.querySelector(
        `[data-chat-id="${message.recipient}"]`
      );
    } else {
      chatTab = this.elems.chat.querySelector(
        `[data-chat-id="${message.sender}"]`
      );
    }
    chatTab.querySelector(".chat-tab-body").appendChild(line);
    console.log(message);
    console.log(message.attachments);
    console.log(message.attachments.length);
    if (message.attachments.length) {
      for (let i = 0; i < message.attachments.length; i++) {
        let fileData = message.attachments[i].fileData;
        let fileSize = message.attachments[i].fileSize;
        let fileName = message.attachments[i].fileName;
        let fileType = message.attachments[i].fileType;
        console.log(fileType);
        let fileIcon;
        let fileExt = fileName.split(".").pop();

        // split by /
        let splitFileType = fileType.split("/");
        // check if icon isset in icons folder
        if (await Tools.fileExists(`./img/icons/${splitFileType[0]}.svg`)) {
          fileIcon = `<img width="30" src="./img/icons/${splitFileType[0]}.svg" alt="${splitFileType[0]}">`;
        } else if (
          await Tools.fileExists(`./img/icons/${splitFileType[1]}.svg`)
        ) {
          fileIcon = `<img width="30" src="./img/icons/${splitFileType[1]}.svg" alt="${splitFileType[1]}">`;
        } else if (await Tools.fileExists(`./img/icons/${fileExt}.svg`)) {
          fileIcon = `<img width="30" src="./img/icons/${fileExt}.svg" alt="${fileExt}">`;
        } else {
          fileIcon = `<img width="30" src="./img/icons/file.svg" alt="file">`;
        }

        const blob = Tools.base64ToBlob(fileData, fileType);

        // Create object URL for the Blob
        const url = URL.createObjectURL(blob);

        // Use the URL as the source for displaying or downloading the file
        // For example, set it as the src attribute of an <img> or <a> element
        const fileLink = document.createElement("a");
        fileLink.href = url;
        fileLink.download = fileName;
        fileLink.innerHTML = `<div class='d-flex gap-2 m-2 p-2 rounded attachment'>${fileIcon} <div class='d-flex text-start flex-column'><span class='file-name lh-1'>${fileName}</span><span class='file-size'>${Tools.formatFileSize(fileSize)}</span></div></div>`;

        chatTab
          .querySelector(
            'div[data-message-id="' + message.id + '"] .message-content'
          )
          .appendChild(fileLink); // Append the link to the document body or any other suitable location
      }
    }
  }

  static createChatTabs() {
    Recipient.recipients.forEach((recipient) => {
      if (
        this.elems.chat.querySelector(`[data-chat-id="${recipient.hashName}"]`)
      )
        return;
      this.elems.chat.innerHTML += `<div class="chat-tab" data-chat-id="${
        recipient.hashName
      }">
    <div class="chat-tab-header p-3 shadow rounded d-flex justify-content-between align-items-center">
      <div class="chat-tab-title">${recipient.getName()}</div>
      <div class="chat-tab-close-btn">
        <i class="material-icons">close</i>
      </div>
    </div>
    <div class="chat-tab-body"></div>`;
      this.elems.chat
        .querySelector(
          `[data-chat-id="${recipient.hashName}"] .chat-tab-close-btn`
        )
        .addEventListener("click", () => {
          this.selectChatTab("");
        });
    });
  }

  static selectChatTab(hashName) {
    this.createChatTabs();
    this.elems.chat.querySelectorAll(".chat-tab").forEach((tab) => {
      tab.classList.remove("active");
    });
    if (this.elems.chat.querySelector(`[data-chat-id="${hashName}"]`)) {
    }
    this.elems.chat
      .querySelector(`[data-chat-id="${hashName}"]`)
      ?.classList?.add("active");
  }

  static getRecipientUserListItem(recipient) {
    let loginhtml = "";
    let isOnline = recipient.isOnline ? "online" : "";
    if (recipient.displayName) {
      loginhtml = '<span class="fs-6 lh-1">' + recipient.login + "</span>";
    }
    let html =
      '<div class="user d-flex mx-2 p-2" data-user-id="' +
      recipient.hashName +
      '">' +
      '<div class="user-avatar-container position-relative p-2">' +
      '<i class="user-avatar rounded-circle" data-letter="' +
      recipient.getName().charAt(0) +
      '" style="background-color:' +
      recipient.bgcolor +
      '"></i>' +
      '<i class="position-absolute rounded-circle online-marker ' +
      isOnline +
      '"></i>' +
      "</div>" +
      '<div class="d-flex flex-column justify-content-center">' +
      '<span class="fs-5 fw-bold lh-1">' +
      recipient.getName() +
      "</span>" +
      loginhtml;
    "</div>" + "</div>";
    return html;
  }

  static updateUserList() {
    this.elems.usersList.innerHTML = "";
    Recipient.recipients.forEach((recipient) => {
      this.elems.usersList.innerHTML +=
        this.getRecipientUserListItem(recipient);
      console.log(this.getRecipientUserListItem(recipient));
    });

    // init onuser click
    this.elems.usersList.querySelectorAll(".user").forEach((user) => {
      user.addEventListener("click", () => {
        let recipient = Recipient.getByHashName(user.dataset.userId);
        this.elems.recipientInput.value = recipient.login;
        this.selectChatTab(recipient.hashName);
      });
    });
  }

  static updateUserTypingMessage(recipient) {
    let chatTab = this.elems.chat.querySelector(
      `[data-chat-id="${recipient.hashName}"]`
    );
    // add typing message
    chatTab.querySelector(".chat-tab-body .typing-message")?.remove();
    if (recipient.isTyping) {
      chatTab.querySelector(".chat-tab-body").insertAdjacentHTML(
        "beforeend",
        `<div class='message typing-message'><div class="user-avatar-container align-self-baseline position-relative p-2">
      <i class="user-avatar rounded-circle" data-letter="${recipient
        .getName()
        .charAt(0)}" style="background-color:${recipient.bgcolor}"></i>
        </div>
        <div class='message-content'>
        <p><i>typing...</i></p>
        </div>
        <br></div>`
      );
    }
  }

  static setUserInfoToStatusBar() {
    let statusBar = DOM.get("#status-bar");
    if (statusBar) {
      // set avatar
      let color = Tools.getRandomColor();
      statusBar
        .querySelector(".user-avatar-container")
        .insertAdjacentHTML(
          "beforeend",
          `<i class="user-avatar rounded-circle" data-letter="${User.getName().charAt(
            0
          )}" style="background-color:${color}"></i>`
        );
      // setName
      if (User.displayName) {
        statusBar
          .querySelector(".name-container")
          .insertAdjacentHTML(
            "beforeend",
            `<div class="name">${User.displayName}</div>`
          );
      }
      if (User.login) {
        statusBar
          .querySelector(".name-container")
          .insertAdjacentHTML(
            "beforeend",
            `<div class="login">${User.login}</div>`
          );
      }
    }
  }
}

export default DOM;
