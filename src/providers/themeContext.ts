import { createContext } from "react";

export type ThemeMode = "light" | "dark" | "system";

export type ThemeContextValue = {
  /** User preference: fixed light/dark or follow OS. */
  theme: ThemeMode;
  /** Resolved appearance after applying system preference. */
  resolved: "light" | "dark";
  setTheme: (mode: ThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
