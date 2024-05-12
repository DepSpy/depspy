import { Store } from "~/types";

import type { StoreApi } from "zustand";
import { EventBus } from "./eventBus";
const wsPath = "ws://localhost:1822";
export function linkContext(useStore: StoreApi<Store>) {
  const ws = new WebSocket(wsPath);
  ws.addEventListener("open", () => {
    useStore.setState({
      sizeLoading: true,
      rootLoading: true,
      staticRootLoading: true,
    });
    ws.addEventListener("message", (result) => {
      const { type, data } = parseMes(result.data);
      EventBus[type](JSON.parse(data), ws);
    });
  });
  ws.addEventListener("error", () => {
    console.error("连接异常");
  });
  ws.addEventListener("close", () => {
    console.error("连接断开");
  });

  window.addEventListener("beforeunload", () => ws.close());
}
function parseMes(mes: string) {
  return JSON.parse(mes);
}
