import { createServer as createViteServer } from "vite";
import reactPlugin from "@vitejs/plugin-react";
import UnoCSS from "unocss/vite";
import createGraphDataModule from "./plugins/pass-data";
import { resolve } from "path";
import { generateGraphRes } from "./types/types";

export async function createServer(data: generateGraphRes) {
  const server = await createViteServer({
    root: resolve(__dirname, "../", "vite"),
    plugins: [reactPlugin(), createGraphDataModule(data), UnoCSS()],
  });
  await server.listen();
  server.printUrls();
  return server;
}
