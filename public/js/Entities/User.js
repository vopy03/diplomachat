class User {
    static hashName = '';
    static login;
    static displayName;
    static isServerApproved = false

    static setHashName(hashName) {
        this.hashName = hashName;
    }
    static setLogin(login) {
        this.login = login;
    }
}