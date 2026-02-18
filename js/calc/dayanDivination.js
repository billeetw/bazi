/**
 * dayanDivination.js
 * 大衍之數占卦法：三變一爻，十八變一卦
 * 6=老陰(動), 7=少陽(靜), 8=少陰(靜), 9=老陽(動)
 */
(function (global) {
  "use strict";

  /** 一變：分二、掛一、揲四、歸奇。回傳 4 或 8（餘數和） */
  function oneChange(stalks) {
    const left = Math.floor(Math.random() * (stalks - 2)) + 1;
    const right = stalks - 1 - left;
    const leftRem = ((left - 1) % 4) + 1;
    const rightRem = ((right - 1) % 4) + 1;
    return leftRem + rightRem;
  }

  /** 三變得一爻：6(老陰)、7(少陽)、8(少陰)、9(老陽) */
  function getOneLine(stalks) {
    let n = stalks;
    for (let i = 0; i < 3; i++) {
      const remainder = oneChange(n);
      n = n - 1 - remainder;
    }
    return n / 4;
  }

  /** 大衍之數完整占卦：18 變得 6 爻（由下往上，初爻在下） */
  function castHexagram() {
    const lines = [];
    for (let i = 0; i < 6; i++) {
      lines.push(getOneLine(49));
    }
    return lines;
  }

  /** 將 6 爻轉為二進位：陽=1, 陰=0。lines[0]=初爻(下), lines[5]=上爻(頂) */
  function linesToBinary(lines) {
    return lines.map((v) => (v === 7 || v === 9 ? 1 : 0));
  }

  /** Wikibooks 格式：binary 為上到下。我們 lines 為下到上，故需反轉 */
  function binaryToWikibooksFormat(binary) {
    return binary.slice().reverse();
  }

  /** King Wen 序：binary 字串（上到下，與 Wikibooks 表一致）→ 1-64 */
  const BINARY_TO_KING_WEN = {
    "111111": 1, "000000": 2, "010001": 3, "100010": 4, "010111": 5, "111010": 6,
    "000010": 7, "010000": 8, "110111": 9, "111011": 10, "000111": 11, "111000": 12,
    "111101": 13, "101111": 14, "000100": 15, "001000": 16, "011001": 17, "100110": 18,
    "000011": 19, "110000": 20, "101001": 21, "100101": 22, "100000": 23, "000001": 24,
    "111001": 25, "100111": 26, "100001": 27, "011110": 28, "010010": 29, "101101": 30,
    "011100": 31, "001110": 32, "111100": 33, "001111": 34, "101000": 35, "000101": 36,
    "110101": 37, "101011": 38, "010100": 39, "001010": 40, "100011": 41, "110001": 42,
    "011111": 43, "111110": 44, "011000": 45, "000110": 46, "011010": 47, "010110": 48,
    "011101": 49, "101110": 50, "001001": 51, "100100": 52, "110100": 53, "001011": 54,
    "001101": 55, "101100": 56, "110110": 57, "011011": 58, "110010": 59, "010011": 60,
    "110011": 61, "001100": 62, "010101": 63, "101010": 64,
  };

  function getKingWenIndex(lines) {
    const binary = linesToBinary(lines);
    const topToBottom = binaryToWikibooksFormat(binary);
    const key = topToBottom.join("");
    return BINARY_TO_KING_WEN[key] || 1;
  }

  /** 計算變卦：老陰(6)→陽、老陽(9)→陰 */
  function getTransformedLines(lines) {
    return lines.map((v) => {
      if (v === 6) return 7;
      if (v === 9) return 8;
      return v;
    });
  }

  /** 計算互卦：取 2,3,4 爻為下卦，3,4,5 爻為上卦 */
  function getMutualHexagram(lines) {
    const binary = linesToBinary(lines);
    const mutualLower = [binary[1], binary[2], binary[3]];
    const mutualUpper = [binary[2], binary[3], binary[4]];
    return mutualLower.concat(mutualUpper);
  }

  /** 互卦 binary 轉 King Wen（互卦的 binary 為下到上，需轉為上到下） */
  function mutualBinaryToKingWen(mutualBinary) {
    const topToBottom = mutualBinary.slice().reverse();
    const key = topToBottom.join("");
    return BINARY_TO_KING_WEN[key] || 1;
  }

  /** 完整占卦結果 */
  function divinate() {
    const lines = castHexagram();
    const primaryIndex = getKingWenIndex(lines);
    const transformed = getTransformedLines(lines);
    const transformedIndex = getKingWenIndex(transformed);
    const mutualBinary = getMutualHexagram(lines);
    const mutualIndex = mutualBinaryToKingWen(mutualBinary);

    const changingLines = lines
      .map((v, i) => (v === 6 || v === 9 ? i : -1))
      .filter((i) => i >= 0);

    return {
      lines,
      primaryIndex,
      transformedIndex,
      mutualIndex,
      changingLines,
      binary: linesToBinary(lines),
    };
  }

  const api = {
    castHexagram,
    divinate,
    getOneLine,
    getKingWenIndex,
    linesToBinary,
    getTransformedLines,
    getMutualHexagram,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    global.DayanDivination = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
