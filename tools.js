// primeUtils.js

function isPrimeFermat(n, k = 4) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    
    function powerMod(a, b, c) {
        let result = 1;
        a = a % c;
        while (b > 0) {
            if (b % 2 === 1) {
                result = (result * a) % c;
            }
            b = Math.floor(b / 2);
            a = (a * a) % c;
        }
        return result;
    }
    
    for (let i = 0; i < k; i++) {
        let a = Math.floor(Math.random() * (n - 2)) + 2;
        if (powerMod(a, n - 1, n) !== 1) {
            return false;
        }
    }
    
    return true;
}

function getPrimeNum(min, max) {
    let numCount = 0;
    while (true) {
        let randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        numCount++;
        if (isPrimeFermat(randomNumber)) {
            return { primeNum: randomNumber, numCount: numCount };
        }
    }
}

function getPublicKnownVariables(k, min, max) {
    let primeNums = [];
    for (let i = 0; i < k; i++) {
        let res = getPrimeNum(min, max);
        primeNums.push(res.primeNum);
    }
    
    console.log("Прості числа: " + primeNums);
    let primeNumber = primeNums[Math.floor(Math.random() * primeNums.length)];
    console.log("Вибране просте число (p): " + primeNumber);
    
    let alphaA = getPrimeNum(1, primeNumber).primeNum;
    console.log("Число а (alpha): " + alphaA);
    
    return {prime: primeNumber, generator: alphaA};
}

module.exports = { isPrimeFermat, getPrimeNum, getPublicKnownVariables };
