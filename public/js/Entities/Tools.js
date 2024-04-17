class Tools {
  static async getAESEncryptionKey(key) {
    return await window.crypto.subtle.importKey(
      "raw",
      hexStringToArrayBuffer(key),
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

  static async getPublicVars() {
    if(!User.hashName) {
        console.error('User hash name is empty')
        return;
    }
    const sender = User.hashName;
    socket.send(
      JSON.stringify({
        type: "get_public_vars",
        sender,
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

  static async getSharedKey(publicKey, privateKey) {
    let key = modPow(BigInt(publicKey), BigInt(privateKey), BigInt(params.prime));
    return await sha256(key.toString());
  }
}
