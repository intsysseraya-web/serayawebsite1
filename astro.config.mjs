import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://serayasystem.com",
  vite: {
    build: {
      chunkSizeWarningLimit: 900,
    },
  },
});
