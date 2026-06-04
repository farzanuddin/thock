# Thock

A mechanical keyboard typing test built with react. 30 seconds and random words - lets go.

[https://farzanuddin.github.io/thock](https://farzanuddin.github.io/thock/)

## Objective

An attempt to recreate monkeytype but with some inspiration from mechanical keyboards that i have been fascinated with recently. I took the inspiration from a keychron keyboard and saw examples of how it can be recreated. Just a simple typing test that generates words as random when you press a key and uses a few metrics to share about your attempt. 

## Features

- **30-second timed test** — starts on first keystroke, stops automatically
- **Live WPM and accuracy** — updates in real time as you type
- **Mechanical keyboard sounds** — per-key audio sampled from a single `.ogg`
  file, played via the Web Audio API
- **Visual keyboard** — on-screen keyboard highlights each pressed key

## Stack

| Technology                                         | Role                     |
| -------------------------------------------------- | ------------------------ |
| [React](https://react.dev/) 19                     | UI framework             |
| [Vite](https://vitejs.dev/) 7                      | Build tool               |
| [Tailwind CSS](https://tailwindcss.com/) 3         | Utility-first CSS        |
| [random-words](https://github.com/punkave/random-words) | Word list generation |

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the dev server:

   ```bash
   npm dev
   ```