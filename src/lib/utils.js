import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function charsEqual(actual, expected) {
  return normalizeChar(actual) === normalizeChar(expected);
}

export function wordsEqual(actual, expected) {
  if (actual.length !== expected.length) return false;
  for (let i = 0; i < actual.length; i += 1) {
    if (!charsEqual(actual[i], expected[i])) return false;
  }
  return true;
}

export function normalizeChar(char) {
  if (char === "’" || char === "‘") return "'";
  if (char === "“" || char === "”") return '"';
  return char;
}
