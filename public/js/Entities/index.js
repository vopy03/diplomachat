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


// Wait for the page to fully load
window.addEventListener('load', function() {
  // Hide the preload container after at least 1 second

  document.querySelector('#preload-content img').src = 'img/logo-anim.svg';
  setTimeout(function() {
    document.getElementById('preload-container').style.opacity = '0';
    document.getElementById('preload-content').style.scale = '15';
      document.getElementById('preload-container').style.pointerEvents = 'none'; // Disable pointer events
  }, 500); // 1 second delay

  // Show the content after the fade-out animation completes
  setTimeout(function() {
      document.getElementById('preload-container').style.display = 'none';
      document.getElementById('content').style.display = 'block';
  }, 1500); // Wait for 1.5 seconds (including the fade-out duration)

  // for styling only
  // DOM.toggleTab('main-tab')
});
