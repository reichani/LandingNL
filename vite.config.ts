import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "v2",
  publicDir: "public",
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: true,
  },
});
