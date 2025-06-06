import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { viteMockServe } from "vite-plugin-mock";

// https://vite.dev/config/
export default defineConfig({
  base: '/ag-grid-demo/',
  plugins: [
    react(),
    viteMockServe({
      // default
      mockPath: "mock",
      enable: true,
    }),
  ],
});
