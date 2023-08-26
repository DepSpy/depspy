import { Plugin } from "vite";
import path from "path";
import { copyFileSync } from "fs";
export default function generate404(): Plugin {
  let configResolved = { root: "", mode: "", build: { outDir: "" } };
  return {
    name: "generate-404",
    configResolved(config) {
      configResolved = config;
    },
    writeBundle() {
      const {
        root,
        mode,
        build: { outDir },
      } = configResolved;
      if (mode != "online") return;
      const src = path.join(root, outDir, "index.html");
      const dist = path.join(root, outDir, "404.html");
      copyFileSync(src, dist);
    },
  };
}
