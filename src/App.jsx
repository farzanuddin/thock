import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Command,
  FastForward,
  Frame,
  Info,
  Keyboard,
  LayoutDashboard,
  Lightbulb,
  Mic,
  Moon,
  MousePointer2,
  RotateCcw,
  Search,
  SkipBack,
  SkipForward,
  Sun,
  SunDim,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
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
    { label: "F1", code: "F1", icon: SunDim },
    { label: "F2", code: "F2", icon: Sun },
    { label: "F3", code: "F3", icon: LayoutDashboard },
    { label: "F4", code: "F4", icon: Search },
    { label: "F5", code: "F5", icon: Mic, tone: "dark" },
    { label: "F6", code: "F6", icon: Moon, tone: "dark" },
    { label: "F7", code: "F7", icon: SkipBack, tone: "dark" },
    { label: "F8", code: "F8", icon: SkipForward, tone: "dark" },
    { label: "F9", code: "F9", icon: FastForward, tone: "dark" },
    { label: "F10", code: "F10", icon: VolumeX },
    { label: "F11", code: "F11", icon: Volume1 },
    { label: "F12", code: "F12", icon: Volume2 },
    { label: "", code: "F13", icon: Frame, tone: "dark" },
    { label: "del", code: "Delete", tone: "dark" },
    { label: "", code: "F14", icon: Lightbulb, tone: "dark" },
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
    { label: "", code: "Backspace", icon: ArrowLeft, width: 100, tone: "dark" },
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
    { label: "", code: "ArrowUp", icon: ChevronUp, width: 50 },
    { label: "end", code: "End", width: 50, tone: "dark" },
  ],
  [
    { label: "ctrl", code: "ControlLeft", width: 62, tone: "dark" },
    { label: "option", code: "AltLeft", width: 62, tone: "dark" },
    { label: "", code: "MetaLeft", icon: Command, width: 62, tone: "dark" },
    { label: "", code: "Space", width: 314 },
    { label: "", code: "MetaRight", icon: Command, width: 50, tone: "dark" },
    { label: "fn", code: "Fn", width: 50, tone: "dark" },
    { label: "ctrl", code: "ControlRight", width: 50, tone: "dark" },
    { label: "", code: "ArrowLeft", icon: ChevronLeft, width: 50 },
    { label: "", code: "ArrowDown", icon: ChevronDown, width: 50 },
    { label: "", code: "ArrowRight", icon: ChevronRight, width: 50 },
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
  const [accuracyStats, setAccuracyStats] = useState({
    correct: 0,
    incorrect: 0,
  });
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
  const accuracyTotal = accuracyStats.correct + accuracyStats.incorrect;
  const accuracy = accuracyTotal
    ? Math.round((accuracyStats.correct / accuracyTotal) * 100)
    : 100;

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
      setAccuracyStats({ correct: 0, incorrect: 0 });
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

  const recordAccuracyPress = useCallback((isCorrect) => {
    setAccuracyStats((stats) => ({
      correct: stats.correct + (isCorrect ? 1 : 0),
      incorrect: stats.incorrect + (isCorrect ? 0 : 1),
    }));
  }, []);

  const pressKey = useCallback(
    (code) => {
      if (!code) return;
      setActiveKey(code);
      if (audioEnabled) {
        playKeyboardSound(code, "down", 0.5);
      }
    },
    [audioEnabled],
  );

  const releaseKey = useCallback(
    (code) => {
      if (!code) return;
      setActiveKey((current) => (current === code ? null : current));
      if (audioEnabled) {
        playKeyboardSound(code, "up", 0.5);
      }
    },
    [audioEnabled],
  );

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
        recordAccuracyPress(wordsEqual(typed, currentWord));
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
      recordAccuracyPress(
        Boolean(currentWord[typed.length]) &&
          charsEqual(event.key, currentWord[typed.length]),
      );
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
      recordAccuracyPress,
      resetTest,
      startTest,
      started,
      typed,
      wordIndex,
      wordInputs,
    ],
  );

  const handleVirtualKeyDown = useCallback(
    (code) => {
      const key = getVirtualKey(code);
      if (!key) return;
      handleKeyDown({
        altKey: false,
        code,
        ctrlKey: false,
        key,
        metaKey: false,
        preventDefault: () => {},
        repeat: false,
      });
      focusInput();
    },
    [focusInput, handleKeyDown],
  );

  const handleVirtualKeyUp = useCallback(
    (code) => {
      releaseKey(code);
    },
    [releaseKey],
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
      accuracy,
      characters: `${counts.allCorrectChars}/${counts.allCorrectChars + counts.incorrectChars + counts.extraChars + counts.missedChars}`,
      time: `${Math.round(Math.min(elapsed, TEST_SECONDS))}s`,
    };
  }, [accuracy, counts, startTime, started, totalKeystrokes]);

  return (
    <main className="flex h-screen flex-col overflow-hidden px-5 py-5">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-4">
        <header className="flex w-full shrink-0 items-center justify-between">
          <Button
            className="gap-2 px-0 text-2xl font-bold tracking-[-0.03em] text-primary hover:bg-transparent hover:text-primary"
            variant="ghost"
            onClick={() => resetTest()}
          >
            thock{" "}
            <Keyboard
              size={23}
              className="rounded bg-surface p-0.5 text-muted"
            />
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

        <section className="flex min-h-0 flex-col" onClick={focusInput}>
          {!finished ? (
            <TypingSurface
              author={quote.author}
              accuracy={accuracy}
              focused={focused}
              handleKeyDown={handleKeyDown}
              inputRef={inputRef}
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
        {!finished && (
          <SimpleKeyboard
            activeKey={activeKey}
            audioEnabled={audioEnabled}
            onVirtualKeyDown={handleVirtualKeyDown}
            onVirtualKeyUp={handleVirtualKeyUp}
          />
        )}
      </div>
    </main>
  );
}

function TypingSurface({
  author,
  accuracy,
  focused,
  handleKeyDown,
  inputRef,
  setFocused,
  started,
  timeLeft,
  typed,
  wordIndex,
  wordInputs,
  words,
  wpm,
}) {
  const activeWordRef = useRef(null);
  const wordsContainerRef = useRef(null);
  const [rowOffset, setRowOffset] = useState(0);

  useEffect(() => {
    if (!(activeWordRef.current && wordsContainerRef.current)) {
      setRowOffset(0);
      return;
    }

    const container = wordsContainerRef.current;
    const activeWord = activeWordRef.current;
    const lineHeight = Number.parseFloat(
      window.getComputedStyle(container).lineHeight,
    );
    const row = Math.round(activeWord.offsetTop / lineHeight);
    setRowOffset(Math.max(0, row - 1) * lineHeight);
  }, [typed, wordIndex, words]);

  return (
    <div className="w-full">
      <div
        className={cn(
          "mb-2 min-h-2 transition-opacity",
          started && "opacity-20 hover:opacity-100",
        )}
      />

      <div className="mb-5 flex min-h-8 justify-end gap-6">
        {started && (
          <>
            <Stat label="s" value={timeLeft} />
            <Stat label="wpm" value={wpm} />
            <Stat label="% acc" value={accuracy} />
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
          ref={wordsContainerRef}
        >
          <div
            className="transition-transform duration-200 ease-out"
            style={{ transform: `translateY(-${rowOffset}px)` }}
          >
            {words.map((word, index) => {
              const input =
                index === wordIndex ? typed : wordInputs[index] || "";
              const isPast = index < wordIndex;
              return (
                <span
                  className={cn(
                    "relative mr-4 inline-block whitespace-nowrap",
                    isPast &&
                      input &&
                      !wordsEqual(input, word) &&
                      "after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:rounded-full after:bg-primary/60",
                  )}
                  key={`${word}-${index}`}
                  ref={index === wordIndex ? activeWordRef : undefined}
                >
                  {renderWord(word, input, index === wordIndex && started)}
                </span>
              );
            })}
          </div>
        </div>
        <p className="mt-2 text-center text-sm text-muted/70">- {author}</p>
      </div>

      <div className="mt-5 grid place-items-center gap-4 text-muted/45">
        <div className="flex items-center gap-3 text-sm text-muted/45">
          <kbd className="rounded-md bg-surface px-2 py-1">tab</kbd>
          <span>+</span>
          <kbd className="rounded-md bg-surface px-2 py-1">enter</kbd>
          <span>restart</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <span className="tabular-nums">
      <strong className="font-bold text-primary">{value}</strong>
      <span className="ml-1 text-muted">{label}</span>
    </span>
  );
}

function Results({ resultStats, resetTest, nextTest }) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-12 text-center">
      <div className="grid w-full max-w-3xl grid-cols-2 items-end gap-10">
        <div>
          <div className="text-[8rem] font-black leading-none tracking-[-0.06em] text-primary sm:text-[11rem]">
            {resultStats.wpm}
          </div>
          <div className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-muted">
            WPM
          </div>
        </div>
        <div>
          <div className="text-[8rem] font-black leading-none tracking-[-0.06em] text-foreground sm:text-[11rem]">
            {resultStats.accuracy}
            <span className="text-muted">%</span>
          </div>
          <div className="mt-6 text-sm font-semibold uppercase tracking-[0.22em] text-muted">
            Accuracy
          </div>
        </div>
      </div>

      <div className="flex items-center gap-16">
        <Metric label="Raw" value={resultStats.raw} />
        <div className="h-10 w-px bg-border" />
        <Metric label="Time" value={resultStats.time} />
        <div className="h-10 w-px bg-border" />
        <Metric label="Characters" value={resultStats.characters} />
      </div>

      <div className="flex items-center gap-4">
        <FormulaTooltip />
        <Button
          className="rounded-full px-5"
          variant="subtle"
          onClick={() => resetTest()}
        >
          restart
        </Button>
        <Button className="rounded-full px-5" onClick={nextTest}>
          next
        </Button>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        {label}
      </div>
    </div>
  );
}

function FormulaTooltip() {
  return (
    <div className="group relative">
      <Button className="rounded-full px-4 text-muted" variant="ghost">
        <Info size={17} />
        formula
      </Button>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-4 w-[34rem] -translate-x-1/2 rounded-lg border border-border bg-[#17151d] p-5 text-left opacity-0 shadow-2xl transition-opacity group-hover:opacity-100">
        <FormulaSection
          title="WPM"
          formula="(correct chars + spaces) / 5 / minutes"
          description="Only fully correct words and their spaces count. A correct prefix of the current word is included while typing."
        />
        <FormulaSection
          title="Raw"
          formula="total keystrokes / 5 / minutes"
          description="Every keystroke counts regardless of accuracy. This measures raw typing speed before mistakes are considered."
        />
        <FormulaSection
          title="Accuracy"
          formula="correct keypresses / total keypresses × 100"
          description="Corrections do not erase mistakes from accuracy. Backspace fixes the text, but the original missed keypress still counts."
          last
        />
      </div>
    </div>
  );
}

function FormulaSection({ description, formula, last, title }) {
  return (
    <div className={cn(!last && "mb-5 border-b border-border pb-5")}>
      <div className="mb-2 text-sm font-bold text-foreground">{title}</div>
      <div className="mb-3 rounded-md bg-surface px-3 py-2 text-sm text-muted">
        {formula}
      </div>
      <p className="text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}

function SimpleKeyboard({
  activeKey,
  audioEnabled,
  onVirtualKeyDown,
  onVirtualKeyUp,
}) {
  const [pointerKey, setPointerKey] = useState(null);
  const pressedKey = pointerKey ?? activeKey;

  const pressPointerKey = useCallback(
    (event, code) => {
      event.preventDefault();
      event.stopPropagation();
      if (!code) return;
      setPointerKey(code);
      onVirtualKeyDown(code);
      if (audioEnabled) {
        playKeyboardSound(code, "down", 0.5);
      }
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is best-effort; the key still works without it.
      }
    },
    [audioEnabled, onVirtualKeyDown],
  );

  const releasePointerKey = useCallback(
    (event, code) => {
      event.preventDefault();
      event.stopPropagation();
      if (!code) return;
      setPointerKey((current) => (current === code ? null : current));
      onVirtualKeyUp(code);
    },
    [onVirtualKeyUp],
  );

  useEffect(() => {
    if (!pointerKey) return undefined;
    const clearPointerKey = () => setPointerKey(null);
    window.addEventListener("pointerup", clearPointerKey);
    window.addEventListener("pointercancel", clearPointerKey);
    return () => {
      window.removeEventListener("pointerup", clearPointerKey);
      window.removeEventListener("pointercancel", clearPointerKey);
    };
  }, [pointerKey]);

  return (
    <section
      className="mx-auto hidden h-[245px] shrink-0 overflow-visible lg:block mb-10"
      aria-hidden="true"
    >
      <div className="origin-top scale-[0.82] rounded-xl border border-[#55515d] bg-[#4a4850] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
        <div className="h-[278px] rounded-[5px] rounded-t-lg border border-zinc-500 bg-zinc-700">
          <div className="-translate-y-1 -space-y-1 overflow-hidden rounded-[5px]">
            {KEY_ROWS.map((row, rowIndex) => (
              <div className="flex" key={`row-${rowIndex}`}>
                {row.map((key, keyIndex) => (
                  <Key
                    active={pressedKey === key.code}
                    code={key.code}
                    key={`${key.label}-${keyIndex}`}
                    onPointerDown={pressPointerKey}
                    onPointerRelease={releasePointerKey}
                    tone={key.tone}
                    width={key.width}
                  >
                    {key.icon ? (
                      <>
                        <key.icon size={11} strokeWidth={2.2} />
                        {key.label && <span>{key.label}</span>}
                      </>
                    ) : key.top ? (
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
      </div>
    </section>
  );
}

function Key({
  active,
  children,
  code,
  onPointerDown,
  onPointerRelease,
  tone,
  width = 50,
}) {
  const variant = getKeyVariant(tone);
  return (
    <button
      aria-label={typeof children === "string" ? children : undefined}
      className="flex cursor-pointer touch-none appearance-none items-end border-0 bg-transparent p-0 text-left focus:outline-none"
      style={{ height: 50, width }}
      onPointerCancel={(event) => onPointerRelease(event, code)}
      onPointerDown={(event) => onPointerDown(event, code)}
      onPointerLeave={(event) => {
        if (active) onPointerRelease(event, code);
      }}
      onPointerUp={(event) => onPointerRelease(event, code)}
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

function getVirtualKey(code) {
  if (code.startsWith("Key")) return code.slice(3).toLowerCase();
  if (code.startsWith("Digit")) return code.slice(5);

  const keys = {
    Backquote: "`",
    Backspace: "Backspace",
    Backslash: "\\",
    BracketLeft: "[",
    BracketRight: "]",
    Comma: ",",
    Enter: "Enter",
    Equal: "=",
    Minus: "-",
    Period: ".",
    Quote: "'",
    Semicolon: ";",
    Slash: "/",
    Space: " ",
    Tab: "Tab",
  };

  return keys[code] ?? null;
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
        ? "text-[#3f3a46]"
        : charsEqual(actual, expected)
          ? "text-[#f4eff8]"
          : expected
            ? "text-primary"
            : "text-primary/70";

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

function Caret() {
  return <span className="typing-caret" aria-hidden="true" />;
}
