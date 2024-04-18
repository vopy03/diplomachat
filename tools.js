// primeUtils.js


// function isPrimeFermat(n, k = 4) {
//   if (n <= 1) return false;
//   if (n <= 3) return true;

//   function powerMod(a, b, c) {
//     let result = 1;
//     a = a % c;
//     while (b > 0) {
//       if (b % 2 === 1) {
//         result = (result * a) % c;
//       }
//       b = Math.floor(b / 2);
//       a = (a * a) % c;
//     }
//     return result;
//   }

//   for (let i = 0; i < k; i++) {
//     let a = Math.floor(Math.random() * (n - 2)) + 2;
//     if (powerMod(a, n - 1, n) !== 1) {
//       return false;
//     }
//   }

//   return true;
// }

// function getPrimeNum(min, max) {
//   let numCount = 0;
//   while (true) {
//     let randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
//     numCount++;
//     if (isPrimeFermat(randomNumber)) {
//       return { primeNum: randomNumber, numCount: numCount };
//     }
//   }
// }

function getPublicKnownVariables(k) {
  let primeNums = [];
  for (let i = 0; i < k; i++) {
    let res = getRandomPrimeNum();
    primeNums.push(res.primeNum);
  }

  console.log("Прості числа: " + primeNums);
  let primeNumber = primeNums[Math.floor(Math.random() * primeNums.length)];
  console.log("Вибране просте число (p): " + primeNumber);

  let alphaA = getRandomPrimeNumSmallerThan(primeNumber);
  console.log("Число а (alpha): " + alphaA);

  return { prime: primeNumber, generator: alphaA };
}

function getRandomPrimeNum() {
  // Read the contents of the text file
  fs.readFile("assets/primenums.txt", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }

    // Split the contents by newline
    const primes = data.split("\n");

    // Filter out prime numbers
    globalThis.primeNumbers = primes.filter((prime) => isPrime(parseInt(prime)));

    // Get a random prime number
    const randomIndex = Math.floor(Math.random() * primeNumbers.length);
    const randomPrime = primeNumbers[randomIndex];
    console.log("Random prime number:", randomPrime);
    return randomPrime;
  });
}
function getRandomPrimeNumSmallerThan(num) {
  // Get another random prime number smaller than the first one
  const smallerPrimes = globalThis.primeNumbers.filter((prime) => prime < num);
  if (smallerPrimes.length > 0) {
    const smallerRandomIndex = Math.floor(Math.random() * smallerPrimes.length);
    const smallerRandomPrime = smallerPrimes[smallerRandomIndex];
    console.log("Smaller random prime number:", smallerRandomPrime);
  } else {
    console.log("No prime number smaller than the first one found.");
  }
}

module.exports = { isPrimeFermat, getPrimeNum, getPublicKnownVariables };
