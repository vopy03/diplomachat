import Tools from "./Tools.js";

class Encryptor {
  static iv = "";
  static algorithm = "AES-GCM";

  static async encrypt(text, key) {
    if (!key) {
      return false;
    }
    key = await Tools.getAESEncryptionKey(key);
    const encodedData = new TextEncoder().encode(text);

    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv: this.iv, // Use the provided IV
      },
      key,
      encodedData
    );
    return encryptedData;
  }
  static async decrypt(encryptedData, key) {
    if (typeof key === 'string') {
        key = await Tools.getAESEncryptionKey(key);
    }
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: this.algorithm,
        iv: this.iv, // Use the same IV used during encryption
      },
      key,
      encryptedData
    );
    return new TextDecoder().decode(decryptedData);
  }

  static setEncryptionIV(iv) {
    this.iv = iv;
  }
  static setEncryptionAlgorithm(algorithm) {
    this.algorithm = algorithm;
  }
}

export default Encryptor;