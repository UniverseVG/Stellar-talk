/* eslint-disable no-undef */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Polyfill for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Specify the path to the .env file located outside the current folder
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.CLIENT_PORT,
    proxy: {
      "/api": {
        target: process.env.VITE_SERVER_URL,
        changeOrigin: true,
      },
    },
  },
});
