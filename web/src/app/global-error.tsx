"use client";

import { useEffect } from "react";

// Global error boundary — catches errors thrown in the root layout itself.
// It must render its own <html>/<body> because it replaces the root layout.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
          color: "#0f172a",
          background: "#f8fafc",
        }}
      >
        <div style={{ fontSize: "3.5rem" }}>⚠️</div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "1rem 0 0.5rem" }}>
          Application error
        </h1>
        <p style={{ maxWidth: "28rem", color: "#64748b", margin: 0 }}>
          A critical error occurred while loading the page. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "2rem",
            padding: "0.625rem 1.5rem",
            borderRadius: "0.75rem",
            border: "none",
            background: "#272757",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
