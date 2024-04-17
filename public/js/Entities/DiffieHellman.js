class DiffieHellman {
  static prime = 0;
  static generator = 0;
  static sharedKeys = [];
  static publicKey = "";
  static privateKey = "";

  static generateKeys() {
    // Generate a random private key as a Uint8Array
    let privateArray = new Uint8Array(32);
    window.crypto.getRandomValues(privateArray);
    console.log(privateArray);
    // Convert the Uint8Array to a BigInt
    let privateBigInt = arrayToBigInt(privateArray);

    // Calculate the public key
    let public = modPow(
      BigInt(this.generator),
      privateBigInt,
      BigInt(this.prime)
    );

    return { public, private: privateBigInt };
  }
  
}
