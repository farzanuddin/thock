export function countTyping({
  words,
  inputs,
  typed,
  wordIndex,
  final = false,
  timed = true,
}) {
  const inputWords = [...inputs.slice(0, wordIndex), typed];
  let allCorrectChars = 0;
  let correctWordChars = 0;
  let correctSpaces = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let missedChars = 0;
  const shouldCountPartialLastWord = !final || (final && timed);

  for (let i = 0; i < inputWords.length; i += 1) {
    const target = words[i];
    const input = inputWords[i] || "";
    if (!target) break;

    if (wordsEqual(input, target)) {
      correctWordChars += target.length;
      allCorrectChars += target.length;
      if (i < inputWords.length - 1) correctSpaces += 1;
      continue;
    }

    for (let c = 0; c < input.length; c += 1) {
      if (c >= target.length) {
        extraChars += 1;
      } else if (charsEqual(input[c], target[c])) {
        allCorrectChars += 1;
      } else {
        incorrectChars += 1;
      }
    }

    if (input.length < target.length) {
      const missed = target.length - input.length;
      let currentWordIncorrect = 0;
      for (let c = 0; c < input.length; c += 1) {
        if (!charsEqual(input[c], target[c])) currentWordIncorrect += 1;
      }
      if (final || i < inputWords.length - 1) {
        missedChars += missed;
      }
      if (
        i === inputWords.length - 1 &&
        shouldCountPartialLastWord &&
        currentWordIncorrect === 0
      ) {
        correctWordChars += input.length;
      }
    }
  }

  const numerator = correctWordChars + correctSpaces;
  const accuracyDenominator = allCorrectChars + incorrectChars;
  const accuracy = accuracyDenominator
    ? Math.round((allCorrectChars / accuracyDenominator) * 100)
    : 100;

  return {
    numerator,
    accuracy,
    allCorrectChars,
    correctWordChars,
    incorrectChars,
    extraChars,
    missedChars,
  };
}

export function getWpm(numerator, elapsedSeconds) {
  return Math.round(numerator / 5 / Math.max(elapsedSeconds / 60, 1 / 60));
}

function charsEqual(actual, expected) {
  return normalizeChar(actual) === normalizeChar(expected);
}

function wordsEqual(actual, expected) {
  if (actual.length !== expected.length) return false;
  for (let i = 0; i < actual.length; i += 1) {
    if (!charsEqual(actual[i], expected[i])) return false;
  }
  return true;
}

function normalizeChar(char) {
  if (char === "’" || char === "‘") return "'";
  if (char === "“" || char === "”") return '"';
  return char;
}
