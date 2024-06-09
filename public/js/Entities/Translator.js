import DOM from "./DOM.js";

class Translator {
  static translations = {
    en: {
      "Set Login": "Set Login",
      "Type your login": "Type your login",
      "Visible name (optional)": "Visible name (optional)",
      "Visible name that other users will see":
        "Visible name that other users will see",
      "Settings": "Settings",
      "Password": "Password",
      "The password that the user will need to enter when he wants to start communicating with you":
        "The password that the user will need to enter when he wants to start communicating with you",
      "Set login": "Set login",
      "This login already in use. Please try again with a different one.":
        "This login already in use. Please try again with a different one.",
      "User %s is online!": "User %s is online!",
      "User %s not found or offline": "User %s not found or offline",
      "You can't add yourself": "You can't add yourself",
      "Submit": "Submit",
      "Add user": "Add user",
      "User login": "User login",
      "Close": "Close",
      "Add": "Add",
      "In order to communicate with this user, you need to enter a password. Or you can wait until that user sends a message to you.":
        "In order to communicate with this user, you need to enter a password. Or you can wait until that user sends a message to you.",
      "Password entered successfully!": "Password entered successfully!",
      "Size of attachments is too big (Max: 10MB)":
        "Size of attachments is too big (Max: 10MB)",

      "Connected to server": "Connected to server",
    },
    ua: {
      "Set Login": "Встановити Логін",
      "Type your login": "Введіть свій логін",
      "Visible name (optional)": "Видиме ім'я (необов'язково)",
      "Visible name that other users will see":
        "Видиме ім'я, яке бачитимуть інші користувачі",
      "Settings": "Налаштування",
      "Password": "Пароль",
      "The password that the user will need to enter when he wants to start communicating with you":
        "Пароль, який користувач повинен буде ввести, щоб почати спілкування з вами",
      "Set login": "Встановити логін",
      "This login already in use. Please try again with a different one.":
        "Цей логін вже використовується. Будь ласка, спробуйте інший.",
      "User %s is online!": "Користувач %s онлайн!",
      "User %s not found or offline": "Користувач %s не знайдений або офлайн",
      "You can't add yourself": "Ви не можете додати себе",
      "Submit": "Надіслати",
      "Add user": "Додати користувача",
      "User login": "Логін користувача",
      "Close": "Закрити",
      "Add": "Додати",
      "In order to communicate with this user, you need to enter a password. Or you can wait until that user sends a message to you.":
        "Щоб спілкуватися з цим користувачем, вам потрібно ввести пароль. Або ви можете дочекатись, поки цей користувач надішле вам повідомлення.",
      "Password entered successfully!": "Пароль введено успішно!",
      "Size of attachments is too big (Max: 10MB)":
        "Розмір файл(у/ів) занадто великий (Макс: 10 МБ)",
      "Connected to server": "Під'єднаний до сервера",
      "Login name": "Логін",
      "Please enter a valid login name. (minimal length 3 symbols)":
        "Будь ласка, введіть дійсний логін. (мінімальна довжина 3 символи)",
      "Incorrect password. Try Again": "Невірний пароль. Спробуйте ще.",
      "User": "Користувач",
      "is online!": "онлайн!",
      "not found or offline": "не знайдений або офлайн",

      "Recipient": "Отримувач",
      "not found or not connected.": "не знайдений або не під'єднаний.",
      "entered the correct password.\nNow he can communicate with you!": "ввів правильний пароль.\nТепер він може спілкуватися з вами!",
      "You can't add yourself": "Ви не можете додати себе",
      "Disconnected from websocket. Reload page.": "Від'єднані від websocket. Перезавантажте сторінку.",
    },
  };
  static languages = {
    en: "English",
    ua: "Українська",
  };
  static init() {
    let langSwitcher = DOM.get("#lang-switcher");
    langSwitcher.innerText = this.getLanguage().toUpperCase();
    let langMenu = DOM.get('#lang-switcher-dropdown');

    // add langs
    let menu = langMenu.querySelector(".dropdown-menu");
    for (let lang in this.languages) {
      menu.insertAdjacentHTML(
        "beforeend",
        `
                <li><a class="dropdown-item" href="#">${this.languages[lang]}</a></li>
            `
      );
    }
    // onclick event to every li
    menu.querySelectorAll("li").forEach((li) => {
      li.addEventListener("click", () => {
        let lang = li.querySelector("a").innerText
        let langCode = Object.keys(this.languages).find(key => this.languages[key] === lang);
        this.setLanguage(langCode);
        // this.replaceTextNodes();
        window.location.reload();
      });
    });
    // <li><a class="dropdown-item" href="#">Action</a></li>
  }
  static trans(text) {
    // check if text is provided
    if (!text) {
        return ''
    }
    //  translate text
    return this.translations[this.getLanguage()][text] || text;
}
  static setLanguage(lang) {
    // set parameter to local storage
    localStorage.setItem("language", lang);
  }
  static getLanguage() {
    // get parameter from local storage
    // if(not set)
    if (!localStorage.getItem("language")) {
      localStorage.setItem("language", "en");
    }

    return localStorage.getItem("language");
  }

  static getTextNodes(node) {
    let textNodes = [];

    function traverse(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node);
      } else {
        for (let child of node.childNodes) {
          traverse(child);
        }
      }
    }

    traverse(node);
    return textNodes;
  }
  static replaceTextNodes() {
    let textNodes = this.getTextNodes(document.body);

    textNodes.forEach((node) => {
      if (this.translations[this.getLanguage()][node.nodeValue.trim()]) {
        node.nodeValue =
          this.translations[this.getLanguage()][node.nodeValue.trim()];
      }
    });
  }
}

export default Translator;
