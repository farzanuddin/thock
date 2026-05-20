import { Keyboard, MousePointer2, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./components/Button";
import { getQuote } from "./lib/quotes";
import { loadKeyboardSound, playKeyboardSound } from "./lib/keyboardSound";
import { cn } from "./lib/utils";
import { countTyping, getWpm } from "./lib/wpm";

const TEST_SECONDS = 30;
const KEY_ROWS = [
  [
    { label: "esc", code: "Escape", tone: "accent" },
    { label: "F1", code: "F1", top: "☼" },
    { label: "F2", code: "F2", top: "☀" },
    { label: "F3", code: "F3", top: "⌘" },
    { label: "F4", code: "F4", top: "⌕" },
    { label: "F5", code: "F5", top: "♬", tone: "dark" },
    { label: "F6", code: "F6", top: "☾", tone: "dark" },
    { label: "F7", code: "F7", top: "◁", tone: "dark" },
    { label: "F8", code: "F8", top: "▷", tone: "dark" },
    { label: "F9", code: "F9", top: "▷▷", tone: "dark" },
    { label: "F10", code: "F10", top: "◐" },
    { label: "F11", code: "F11", top: "◑" },
    { label: "F12", code: "F12", top: "◒" },
    { label: "#", code: "F13", tone: "dark" },
    { label: "del", code: "Delete", tone: "dark" },
    { label: "☼", code: "F14", tone: "dark" },
  ],
  [
    { label: "`", code: "Backquote", top: "~" },
    { label: "1", code: "Digit1", top: "!" },
    { label: "2", code: "Digit2", top: "@" },
    { label: "3", code: "Digit3", top: "#" },
    { label: "4", code: "Digit4", top: "$" },
    { label: "5", code: "Digit5", top: "%" },
    { label: "6", code: "Digit6", top: "^" },
    { label: "7", code: "Digit7", top: "&" },
    { label: "8", code: "Digit8", top: "*" },
    { label: "9", code: "Digit9", top: "(" },
    { label: "0", code: "Digit0", top: ")" },
    { label: "-", code: "Minus", top: "_" },
    { label: "=", code: "Equal", top: "+" },
    { label: "←", code: "Backspace", width: 100, tone: "dark" },
    { label: "pgup", code: "PageUp", width: 50, tone: "dark" },
  ],
  [
    { label: "tab", code: "Tab", width: 75, tone: "dark" },
    ...["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"].map((key) => ({
      label: key.toUpperCase(),
      code: `Key${key.toUpperCase()}`,
    })),
    { label: "[", code: "BracketLeft", top: "{" },
    { label: "]", code: "BracketRight", top: "}" },
    { label: "\\", code: "Backslash", top: "|", width: 75, tone: "dark" },
    { label: "pgdn", code: "PageDown", width: 50, tone: "dark" },
  ],
  [
    { label: "caps lock", code: "CapsLock", width: 100, tone: "dark" },
    ...["a", "s", "d", "f", "g", "h", "j", "k", "l"].map((key) => ({
      label: key.toUpperCase(),
      code: `Key${key.toUpperCase()}`,
    })),
    { label: ";", code: "Semicolon", top: ":" },
    { label: "'", code: "Quote", top: '"' },
    { label: "return", code: "Enter", width: 100, tone: "dark" },
    { label: "home", code: "Home", width: 50, tone: "dark" },
  ],
  [
    { label: "shift", code: "ShiftLeft", width: 123, tone: "dark" },
    ...["z", "x", "c", "v", "b", "n", "m"].map((key) => ({
      label: key.toUpperCase(),
      code: `Key${key.toUpperCase()}`,
    })),
    { label: ",", code: "Comma", top: "<" },
    { label: ".", code: "Period", top: ">" },
    { label: "/", code: "Slash", top: "?" },
    { label: "shift", code: "ShiftRight", width: 77, tone: "dark" },
    { label: "^", code: "ArrowUp", width: 50 },
    { label: "end", code: "End", width: 50, tone: "dark" },
  ],
  [
    { label: "ctrl", code: "ControlLeft", width: 62, tone: "dark" },
    { label: "option", code: "AltLeft", width: 62, tone: "dark" },
    { label: "⌘", code: "MetaLeft", width: 62, tone: "dark" },
    { label: "", code: "Space", width: 314 },
    { label: "⌘", code: "MetaRight", width: 50, tone: "dark" },
    { label: "fn", code: "Fn", width: 50, tone: "dark" },
    { label: "ctrl", code: "ControlRight", width: 50, tone: "dark" },
    { label: "‹", code: "ArrowLeft", width: 50 },
    { label: "∨", code: "ArrowDown", width: 50 },
    { label: "›", code: "ArrowRight", width: 50 },
  ],
];

export default function App() {
  const [quote, setQuote] = useState(() => getQuote());
  const [typed, setTyped] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [wordInputs, setWordInputs] = useState([]);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TEST_SECONDS);
  const [startTime, setStartTime] = useState(null);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [focused, setFocused] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const tabArmedRef = useRef(false);

  const counts = useMemo(
    () =>
      countTyping({
        words: quote.words,
        inputs: wordInputs,
        typed,
        wordIndex,
        final: finished,
      }),
    [finished, quote.words, typed, wordIndex, wordInputs],
  );

  const elapsedSeconds =
    started && startTime
      ? Math.min(TEST_SECONDS, Math.max((Date.now() - startTime) / 1000, 1))
      : 0;
  const wpm = started ? getWpm(counts.numerator, elapsedSeconds) : 0;

  const focusInput = useCallback(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const resetTest = useCallback(
    (nextQuote = quote) => {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
      tabArmedRef.current = false;
      setQuote(nextQuote);
      setTyped("");
      setWordIndex(0);
      setWordInputs([]);
      setStarted(false);
      setFinished(false);
      setTimeLeft(TEST_SECONDS);
      setStartTime(null);
      setTotalKeystrokes(0);
      setActiveKey(null);
      requestAnimationFrame(focusInput);
    },
    [focusInput, quote],
  );

  const nextTest = useCallback(() => {
    resetTest(getQuote());
  }, [resetTest]);

  const finishTest = useCallback(() => {
    window.clearInterval(timerRef.current);
    timerRef.current = null;
    setFinished(true);
  }, []);

  const startTest = useCallback(() => {
    const now = Date.now();
    setStarted(true);
    setStartTime(now);
    timerRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - now) / 1000);
      const remaining = Math.max(TEST_SECONDS - elapsed, 0);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        finishTest();
      }
    }, 250);
  }, [finishTest]);

  const pressKey = useCallback((code) => {
    if (!code) return;
    setActiveKey(code);
    if (audioEnabled) {
      playKeyboardSound(code, "down", 0.5);
    }
  }, [audioEnabled]);

  const releaseKey = useCallback((code) => {
    if (!code) return;
    setActiveKey((current) => (current === code ? null : current));
    if (audioEnabled) {
      playKeyboardSound(code, "up", 0.5);
    }
  }, [audioEnabled]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
        tabArmedRef.current = true;
        pressKey(event.code);
        window.setTimeout(() => {
          tabArmedRef.current = false;
        }, 1000);
        return;
      }

      if (event.key === "Enter" && tabArmedRef.current) {
        event.preventDefault();
        resetTest();
        return;
      }

      if (finished || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.length > 1 && event.key !== "Backspace") return;

      if (!event.repeat) {
        pressKey(event.code);
      }

      const currentWord = quote.words[wordIndex] || "";

      if (!started && event.key !== "Backspace") {
        startTest();
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        if (typed.length > 0) {
          setTyped((value) => value.slice(0, -1));
        } else if (wordIndex > 0) {
          setWordIndex((index) => index - 1);
          setWordInputs((inputs) => {
            const previousInput = inputs[inputs.length - 1] || "";
            setTyped(previousInput);
            return inputs.slice(0, -1);
          });
        }
        return;
      }

      if (event.key === " ") {
        event.preventDefault();
        if (!typed) return;
        setTotalKeystrokes((count) => count + 1);
        const nextInputs = [...wordInputs, typed];
        if (wordIndex + 1 >= quote.words.length) {
          setWordInputs(nextInputs);
          finishTest();
          return;
        }
        setWordInputs(nextInputs);
        setTyped("");
        setWordIndex((index) => index + 1);
        return;
      }

      const nextTyped = typed + event.key;
      setTotalKeystrokes((count) => count + 1);
      setTyped(nextTyped);
      if (
        wordIndex + 1 >= quote.words.length &&
        nextTyped.length >= currentWord.length
      ) {
        finishTest();
      }
    },
    [
      finishTest,
      finished,
      pressKey,
      quote.words,
      resetTest,
      startTest,
      started,
      typed,
      wordIndex,
      wordInputs,
    ],
  );

  useEffect(() => {
    focusInput();
    return () => window.clearInterval(timerRef.current);
  }, [focusInput]);

  useEffect(() => {
    const refocus = () => focusInput();
    document.addEventListener("keydown", refocus);
    return () => document.removeEventListener("keydown", refocus);
  }, [focusInput]);

  useEffect(() => {
    void loadKeyboardSound();

    const handleKeyUp = (event) => {
      releaseKey(event.code);
    };
    const handleBlur = () => {
      setActiveKey(null);
    };

    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [releaseKey]);

  const resultStats = useMemo(() => {
    const elapsed =
      started && startTime
        ? Math.max((Date.now() - startTime) / 1000, 1)
        : TEST_SECONDS;
    return {
      wpm: getWpm(counts.numerator, elapsed),
      raw: getWpm(totalKeystrokes, elapsed),
      accuracy: counts.accuracy,
      characters: `${counts.allCorrectChars}/${counts.incorrectChars + counts.extraChars + counts.missedChars}`,
      time: `${Math.round(Math.min(elapsed, TEST_SECONDS))}s`,
    };
  }, [counts, startTime, started, totalKeystrokes]);

  return (
    <main className="flex h-screen flex-col overflow-hidden px-5 py-5 sm:px-10 lg:px-20">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between">
        <Button
          className="gap-2 px-0 text-2xl font-bold tracking-[-0.03em] text-primary hover:bg-transparent hover:text-primary"
          variant="ghost"
          onClick={() => resetTest()}
        >
          thock{" "}
          <Keyboard size={23} className="rounded bg-surface p-0.5 text-muted" />
        </Button>
        <Button
          className="rounded-full bg-surface px-4 text-sm text-foreground/70 hover:bg-surface/80"
          variant="ghost"
          onClick={() => setAudioEnabled((enabled) => !enabled)}
        >
          {audioEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          Audio
        </Button>
      </header>

      <section
        className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col justify-start pt-8"
        onClick={focusInput}
      >
        {!finished ? (
          <TypingSurface
            author={quote.author}
            counts={counts}
            focused={focused}
            handleKeyDown={handleKeyDown}
            inputRef={inputRef}
            resetTest={resetTest}
            setFocused={setFocused}
            started={started}
            timeLeft={timeLeft}
            typed={typed}
            wordIndex={wordIndex}
            wordInputs={wordInputs}
            words={quote.words}
            wpm={wpm}
          />
        ) : (
          <Results
            resultStats={resultStats}
            resetTest={resetTest}
            nextTest={nextTest}
          />
        )}
      </section>
      {!finished && <SimpleKeyboard activeKey={activeKey} />}
    </main>
  );
}

function TypingSurface({
  author,
  counts,
  focused,
  handleKeyDown,
  inputRef,
  resetTest,
  setFocused,
  started,
  timeLeft,
  typed,
  wordIndex,
  wordInputs,
  words,
  wpm,
}) {
  return (
    <div className="w-full">
      <div
        className={cn(
          "mb-2 min-h-2 transition-opacity",
          started && "opacity-20 hover:opacity-100",
        )}
      />

      <div className="mb-3 flex min-h-8 justify-end gap-6 text-sm text-muted">
        {started && (
          <>
            <Stat label="s" value={timeLeft} />
            <Stat label="wpm" value={wpm} />
            <Stat label="% acc" value={counts.accuracy} />
          </>
        )}
      </div>

      <input
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
        className="fixed bottom-0 left-0 h-px w-px opacity-0"
        onBlur={() => setFocused(false)}
        onChange={() => {}}
        onFocus={() => setFocused(true)}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        spellCheck={false}
        value={typed}
      />

      <div className="relative">
        {!started && !focused && (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center text-muted">
            <span className="flex items-center gap-3 text-base">
              <MousePointer2 size={18} />
              Click or press any key to focus
            </span>
          </div>
        )}
        <div
          className={cn(
            "h-40 overflow-hidden text-center text-[1.55rem] leading-[1.75] text-muted outline-none transition duration-200 sm:text-[1.8rem]",
            !started && !focused && "blur-sm opacity-30",
          )}
        >
          {words.map((word, index) => {
            const input = index === wordIndex ? typed : wordInputs[index] || "";
            return (
              <span
                className="mr-4 inline-block whitespace-nowrap"
                key={`${word}-${index}`}
              >
                {renderWord(word, input, index === wordIndex && started)}
              </span>
            );
          })}
        </div>
        <p className="mt-2 text-center text-sm text-muted/70">- {author}</p>
      </div>

      <div className="mt-5 grid place-items-center gap-4 text-muted">
        <Button
          aria-label="Restart"
          className="text-muted hover:text-foreground"
          size="icon"
          variant="ghost"
          onClick={() => resetTest()}
        >
          <RotateCcw size={24} />
        </Button>
        <div className="flex items-center gap-3 text-sm">
          <kbd className="rounded-md bg-surface px-2 py-1 text-foreground/60">
            tab
          </kbd>
          <span>+</span>
          <kbd className="rounded-md bg-surface px-2 py-1 text-foreground/60">
            enter
          </kbd>
          <span>restart</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <span className="tabular-nums">
      <strong className="text-xl text-foreground">{value}</strong>
      <span className="ml-1 text-xs">{label}</span>
    </span>
  );
}

function Results({ resultStats, resetTest, nextTest }) {
  return (
    <div className="mx-auto grid w-full max-w-3xl place-items-center gap-8 text-center">
      <div>
        <div className="text-8xl font-bold leading-none text-primary sm:text-9xl">
          {resultStats.wpm}
        </div>
        <div className="mt-2 text-muted">wpm</div>
      </div>
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        <ResultCard label="accuracy" value={`${resultStats.accuracy}%`} />
        <ResultCard label="raw" value={resultStats.raw} />
        <ResultCard label="time" value={resultStats.time} />
        <ResultCard label="characters" value={resultStats.characters} />
      </div>
      <div className="flex gap-3">
        <Button variant="subtle" onClick={() => resetTest()}>
          restart
        </Button>
        <Button onClick={nextTest}>next</Button>
      </div>
    </div>
  );
}

function ResultCard({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-surface/65 px-4 py-4 text-muted">
      <div className="text-xs">{label}</div>
      <div className="mt-2 text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}

function SimpleKeyboard({ activeKey }) {
  return (
    <section
      className="mx-auto hidden w-fit max-w-full shrink-0 scale-[0.82] rounded-xl border border-[#55515d] bg-[#4a4850] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] lg:grid"
      aria-hidden="true"
    >
      <div className="h-[278px] rounded-[5px] rounded-t-lg border border-zinc-500 bg-zinc-700">
        <div className="-translate-y-1 -space-y-1 overflow-hidden rounded-[5px]">
          {KEY_ROWS.map((row, rowIndex) => (
            <div className="flex" key={`row-${rowIndex}`}>
              {row.map((key, keyIndex) => (
                <Key
                  active={activeKey === (key.code ?? key.label.toLowerCase())}
                  key={`${key.label}-${keyIndex}`}
                  tone={key.tone}
                  width={key.width}
                >
                  {key.top ? (
                    <>
                      <span>{key.top}</span>
                      <span>{key.label}</span>
                    </>
                  ) : (
                    key.label || " "
                  )}
                </Key>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Key({ active, children, tone, width = 50 }) {
  const variant = getKeyVariant(tone);
  return (
    <button
      aria-label={typeof children === "string" ? children : undefined}
      className="flex cursor-default touch-none appearance-none items-end border-0 bg-transparent p-0 text-left focus:outline-none"
      style={{ height: 50, width }}
      tabIndex={-1}
      type="button"
    >
      <div
        className={cn(
          "relative flex h-[50px] items-start justify-center overflow-hidden rounded rounded-t-xl border border-black/40 transition-all duration-100",
          active && "h-[45px]",
        )}
        style={{ width, backgroundColor: variant.body }}
      >
        <div
          className="relative z-10 flex h-[37px] select-none flex-col items-center justify-between gap-0.5 rounded-md border border-t-0 border-black/40 p-1 text-[9px] font-medium"
          style={{
            width: width - 13,
            backgroundColor: variant.cap,
            color: variant.text,
          }}
        >
          {children}
        </div>
        <div
          className={cn(
            "absolute right-0 bottom-0 z-0 h-px w-8 translate-x-3.5 rotate-[70deg] bg-black/30 transition-all duration-100",
            active && "rotate-[60deg]",
          )}
        />
        <div
          className={cn(
            "absolute bottom-0 left-0 z-0 h-px w-8 -translate-x-3.5 -rotate-[70deg] bg-black/30 transition-all duration-100",
            active && "-rotate-[60deg]",
          )}
        />
      </div>
    </button>
  );
}

function getKeyVariant(tone) {
  if (tone === "accent") {
    return {
      body: "rgba(245, 118, 68, 0.8)",
      cap: "#F57644",
      text: "rgba(0,0,0,0.65)",
    };
  }
  if (tone === "dark") {
    return {
      body: "rgba(115, 115, 115, 0.8)",
      cap: "#737373",
      text: "rgba(255,255,255,0.72)",
    };
  }
  return {
    body: "rgba(245, 245, 245, 0.8)",
    cap: "#F5F5F5",
    text: "rgba(0,0,0,0.7)",
  };
}

function renderWord(word, input, showCaret = false) {
  const letters = [];
  const max = Math.max(word.length, input.length);

  if (showCaret && input.length === 0) {
    letters.push(<Caret key="caret-start" />);
  }

  for (let i = 0; i < max; i += 1) {
    const expected = word[i] || "";
    const actual = input[i];
    const className =
      actual == null
        ? "text-muted"
        : actual === expected
          ? "text-foreground"
          : expected
            ? "text-red-500"
            : "text-red-500/70";

    letters.push(
      <span className={className} key={`${word}-${i}`}>
        {actual ?? expected}
      </span>,
    );

    if (showCaret && i + 1 === input.length) {
      letters.push(<Caret key={`caret-${i}`} />);
    }
  }

  return letters;
}

function Caret() {
  return <span className="typing-caret" aria-hidden="true" />;
}
