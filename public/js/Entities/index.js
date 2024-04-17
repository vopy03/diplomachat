import App from "./App.js";
import Tools from "./Tools.js";
import Message from "./Message.js";
import User from "./User.js";
import Recipient from "./Recipient.js";

window.CHAR_RETURN = 13;
window.socket = new WebSocket("wss://" + window.location.host);

window.TOStopTyping = [];

App.init();

socket.addEventListener("open", () => {
  // writeLine("connected");
  Tools.showNotification("Connected to websocket", "success");
  Tools.getPublicVars();
});

socket.addEventListener("close", () => {
  Tools.showNotification(
    "Disconnected from websocket. Reload page.",
    "warning"
  );
});

window.addEventListener("beforeunload", function (e) {
  // Cancel the event
  // e.preventDefault();

  if (User.hashName) {
    Message.sendTechnicalMessage(
      "send_disconnect_notification",
      null,
      { recipients: Recipient.getAllRecipientHashNames() },
      User.hashName
    );
  }
});
