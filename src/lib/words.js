import { generate } from "random-words";

const WORD_COUNT = 400;

export function getWords() {
  return generate({ exactly: WORD_COUNT });
}
