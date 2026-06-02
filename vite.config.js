import { fileURLToPath, URL } from "url";
import { createRequire } from "module";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const require = createRequire(import.meta.url);
const tauriConf = require("./src-tauri/tauri.conf.json");

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_URL ?? "/",
  define: {
    __APP_VERSION__: JSON.stringify(tauriConf.package.version),
  },
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
