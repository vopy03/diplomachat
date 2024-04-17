import Tools from "./Tools.js";

class DiffieHellman {
  static prime = 0;
  static generator = 0;
  static sharedKeys = [];
  static publicKey = "";
  static privateKey = "";

  static asObject(){
    return {
      prime: this.prime,
      generator: this.generator,
      sharedKeys: this.sharedKeys,
      publicKey: this.publicKey,
      privateKey: this.privateKey,
    }
  }

  static generateKeys() {
    // Generate a random private key as a Uint8Array
    let privateArray = new Uint8Array(32);
    window.crypto.getRandomValues(privateArray);
    console.log(privateArray);
    // Convert the Uint8Array to a BigInt
    let privateBigInt = this.arrayToBigInt(privateArray);

    // Calculate the public key
    let publicKey = this.modPow(
      BigInt(this.generator),
      privateBigInt,
      BigInt(this.prime)
    );

    this.publicKey = publicKey;
    this.privateKey = privateBigInt;
  }

  static arrayToBigInt(array) {
    let result = BigInt(0);
    for (let i = 0; i < array.length; i++) {
      result = (result << 8n) + BigInt(array[i]);
    }
    return result;
  }

  static modPow(base, exponent, modulus) {
    let result = 1n;
    base = base % modulus;
    while (exponent > 0n) {
      if (exponent % 2n === 1n) {
        result = (result * base) % modulus;
      }
      exponent = exponent >> 1n;
      base = (base * base) % modulus;
    }
    return result;
  }
  static async getSharedKey(publicKey, privateKey) {
    let key = this.modPow(
      BigInt(publicKey),
      BigInt(privateKey),
      BigInt(this.prime)
    );
    return await Tools.sha256(key.toString());
  }
}

export default DiffieHellman;