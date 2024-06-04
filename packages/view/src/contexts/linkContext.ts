import { Store } from "~/types";
import type { StoreApi } from "zustand";
import { EventBus } from "./eventBus";
import { useStaticStore } from "./index";

const wsPath = "ws://localhost:1822";

export function linkContext(useStore: StoreApi<Store>) {
  const ws = new WebSocket(wsPath);
  ws.addEventListener("open", () => {
    useStore.setState({
      sizeLoading: true,
      rootLoading: true,
    });
    useStaticStore.setState({
      staticRootLoading: true,
    });
    ws.addEventListener("message", (result) => {
      const { type, data } = parseMes(result.data);
      EventBus[type](
        typeof data === "string" ? JSON.parse(data, nullToInfinity) : data,
        ws,
      );
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
  return JSON.parse(mes, nullToInfinity);
}

function nullToInfinity(key: string, value: unknown) {
  // Infinity 经过序列化会变成null
  if (key === "childrenNumber" && value === null) {
    return Infinity;
  }
  return value;
}
