import type { Config } from "tailwindcss";
import presetEmail from "tailwindcss-preset-email";

export default {
  content: [
    "./components/**/*.html",
    "./emails/**/*.html",
    "./layouts/**/*.html",
  ],
  presets: [presetEmail],
} satisfies Config;
