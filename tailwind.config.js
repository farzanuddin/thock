export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0d0b12",
        foreground: "#d8d3dd",
        muted: "#6e6877",
        surface: "#18161f",
        border: "#282431",
        primary: "#ff5a5f",
        key: "#24212d",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        key: "inset 0 -1px 0 rgba(255,255,255,0.04)",
      },
    },
  },
  plugins: [],
};
