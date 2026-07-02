import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        ocean: "#163252",
        skyglass: "#eef6ff",
        accent: "#2563eb",
        success: "#16a34a",
        warn: "#f59e0b",
        danger: "#ef4444"
      },
      boxShadow: {
        panel: "0 20px 45px -24px rgba(15, 23, 42, 0.25)"
      },
      backgroundImage: {
        "app-gradient":
          "radial-gradient(circle at top left, rgba(37,99,235,0.22), transparent 24%), radial-gradient(circle at top right, rgba(34,197,94,0.16), transparent 26%), linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)"
      }
    }
  },
  plugins: []
};

export default config;
