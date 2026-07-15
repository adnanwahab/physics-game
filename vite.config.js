import { defineConfig } from "vite";
import topLevelAwait from "vite-plugin-top-level-await";
import tailwindcss from "@tailwindcss/vite";

import react from "@vitejs/plugin-react";

import { plugin as markdown } from "vite-plugin-markdown";

export default defineConfig({
  root: "",
  publicDir: "../public/",
  build: {
    target: "esnext",
  },
  // 	resolve: {
  // 		alias: {
  // 			'three/addons': 'three/examples/jsm',
  // 			'three/tsl': 'three/webgpu',
  // 			'three': 'three/webgpu'
  // 		}
  // 	},
  plugins: [
    // topLevelAwait({
    //   promiseExportName: "__tla",
    //   promiseImportName: (i) => `__tla_${i}`,
    // }),
    tailwindcss(),
    react(),
    markdown({ mode: ["html", "toc"] }), // 'html' gives us pre-rendered HTML strings
  ],
  server: {
    port: 5173,
  },
});
