import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (mode === "production" && !env.VITE_API_URL?.trim()) {
    throw new Error("VITE_API_URL is required for production builds.");
  }

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (
              id.includes("node_modules/react-hook-form") ||
              id.includes("node_modules/zod") ||
              id.includes("node_modules/@hookform/resolvers")
            ) {
              return "forms";
            }
            return undefined;
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
    },
  };
});
