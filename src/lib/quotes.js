import quotes from "../data/quotes.json";

export function getQuote() {
  const usableQuotes = quotes.filter((quote) => {
    const length = quote.text.length;
    return length >= 120 && length <= 260;
  });
  const quote = usableQuotes[Math.floor(Math.random() * usableQuotes.length)];

  return {
    author: quote.from,
    words: quote.text.split(" "),
  };
}
