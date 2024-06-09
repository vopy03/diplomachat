import Recipient from "./Recipient.js";
import Encryptor from "./Encryptor.js";
import Tools from "./Tools.js";
import DiffieHellman from "./DiffieHellman.js";
import User from "./User.js";
import Message from "./Message.js";
import DOM from "./DOM.js";
import Translator from "./Translator.js";

class App {
  static funqueue = [];

  static init() {
    window.Recipient = Recipient;
    window.Encryptor = Encryptor;
    window.Tools = Tools;
    window.User = User;
    window.Message = Message;
    window.DiffieHellman = DiffieHellman;
    window.DOM = DOM;
    window.Translator = Translator;
    window.App = App;
    DOM.init();
    Message.init();
    Translator.init();
  }
}

export default App;
