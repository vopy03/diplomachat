import User from "./User.js";

class Tools {
  static async getAESEncryptionKey(key) {
    return await window.crypto.subtle.importKey(
      "raw",
      this.hexStringToArrayBuffer(key),
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  }

  static arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  static base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  static sendRequestToGetPublicVars() {
    const sender = User.hashName;
    socket.send(
      JSON.stringify({
        type: "get_public_vars",
        sender,
      })
    );
  }

  static isJSON(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  static async getPublicVars() {
    // if(!User.hashName) {
    //     console.error('User hash name is empty')
    //     return;
    // }
    // const sender = User.hashName;
    socket.send(
      JSON.stringify({
        type: "get_public_vars",
        // sender,
      })
    );
    return new Promise((resolve, reject) => {
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "public_vars") {
          resolve(data);
        }
      };
    });
  }

  static showNotification(message, type) {
    const notification = document.createElement("div");
    notification.classList.add("notification", type);

    const content = document.createElement("span");
    content.classList.add("notification-content");
    content.innerText = message;
    notification.appendChild(content);

    const closeBtn = document.createElement("button");
    closeBtn.classList.add("close-btn");
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", function () {
      notification.remove();
    });
    notification.appendChild(closeBtn);

    document.getElementById("notificationContainer").appendChild(notification);

    setTimeout(function () {
      notification.style.display = "block";
      setTimeout(function () {
        notification.classList.add("show");
        setTimeout(function () {
          notification.classList.remove("show");
          setTimeout(function () {
            notification.remove();
          }, 500);
        }, 5000);
      }, 100);
    }, 100);
  }
  static async sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    return crypto.subtle.digest("SHA-256", data).then((buffer) => {
      const hashArray = Array.from(new Uint8Array(buffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return hashHex;
    });
  }

  static wrapFunctionQueue(fn, context, params) {
    return function () {
      fn.apply(context, params);
    };
  }

  static readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(reader.error);
      };

      reader.readAsArrayBuffer(file);
    });
  }

  static arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  static base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  static hexStringToArrayBuffer(hexString) {
    const bytes = [];
    for (let i = 0; i < hexString.length; i += 2) {
      bytes.push(parseInt(hexString.substr(i, 2), 16));
    }
    return new Uint8Array(bytes).buffer;
  }

  static base64ToBlob(base64Data, contentType = "") {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
  }

  static handleReceivedFile(fileData, fileName, fileType) {
    // Convert base64 file data to a Blob
    const blob = this.base64ToBlob(fileData, fileType);

    // Create object URL for the Blob
    const url = URL.createObjectURL(blob);

    // Use the URL as the source for displaying or downloading the file
    // For example, set it as the src attribute of an <img> or <a> element
    const fileLink = document.createElement("a");
    fileLink.href = url;
    fileLink.download = fileName;
    fileLink.textContent = `Download ${fileName}`;

    document.body.appendChild(fileLink); // Append the link to the document body or any other suitable location
  }
}

export default Tools;
