import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex h-screen flex-col items-center justify-center gap-4 bg-[#150F18] px-5 text-center">
          <h1 className="text-2xl font-bold text-[#F57644]">
            Something went wrong
          </h1>
          <p className="text-[#6e6877]">
            Press restart or reload the page to try again.
          </p>
          <button
            className="rounded-full bg-[#d8d3dd] px-5 py-2 text-sm font-medium text-[#150F18]"
            onClick={() => this.setState({ error: null })}
            type="button"
          >
            restart
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
