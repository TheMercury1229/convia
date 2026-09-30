"use client";

import * as React from "react";

interface FormLoadingScreenProps {
  backgroundColor?: string;
  textColor?: string;
  isDark?: boolean;
}

export function FormLoadingScreen({
  backgroundColor,
  textColor,
  isDark,
}: FormLoadingScreenProps) {
  const [loadingDots, setLoadingDots] = React.useState(".");
  const [systemDark, setSystemDark] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setSystemDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  const resolvedDark = isDark !== undefined ? isDark : systemDark;

  // Animated dots cycle: Loading. -> Loading.. -> Loading...
  React.useEffect(() => {
    let step = 0;
    const dotStates = [".", "..", "..."];
    setLoadingDots(dotStates[0]);

    const interval = setInterval(() => {
      step = (step + 1) % dotStates.length;
      setLoadingDots(dotStates[step]);
    }, 380);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center p-6 text-center select-none"
      style={{
        backgroundColor:
          backgroundColor || (resolvedDark ? "#090d16" : "#ffffff"),
        color: textColor || (resolvedDark ? "#f8fafc" : "#0f172a"),
        colorScheme: resolvedDark ? "dark" : "light",
      }}
    >
      <div className="flex items-baseline justify-center select-none">
        {/* Left spacer matching width of dots container to guarantee exact optical center */}
        <span className="inline-block w-8 sm:w-10" aria-hidden="true" />
        <span className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight">
          Loading
        </span>
        <span className="inline-block text-left w-8 sm:w-10 text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight">
          {loadingDots}
        </span>
      </div>

      {/* Footer subtle brand */}
      <footer className="fixed bottom-6 left-0 right-0 text-center pointer-events-none select-none">
        <span
          className="text-xs font-medium tracking-wider"
          style={{
            color: resolvedDark
              ? "rgba(255, 255, 255, 0.4)"
              : "rgba(15, 23, 42, 0.4)",
          }}
        >
          powered by{" "}
          <strong
            className="font-bold tracking-tight"
            style={{
              color: resolvedDark
                ? "rgba(255, 255, 255, 0.8)"
                : "rgba(15, 23, 42, 0.8)",
            }}
          >
            convia
          </strong>
        </span>
      </footer>
    </div>
  );
}
