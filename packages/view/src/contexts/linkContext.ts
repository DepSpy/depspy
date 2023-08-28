import { generateGraphRes } from "~/types";
import type { Store } from "./index";
import type { StoreApi } from "zustand";
const wsPath = "ws://localhost:822";
export function linkContext(
  init: (data: generateGraphRes, ws: WebSocket) => void,
  update: (data: generateGraphRes, ws: WebSocket) => void,
  setSize: (data: generateGraphRes) => void,
  useStore: StoreApi<Store>,
) {
  const ws = new WebSocket(wsPath);
  ws.addEventListener("open", () => {
    useStore.setState({ sizeLoading: true, rootLoading: true });
    ws.addEventListener("message", (result) => {
      const { type, data } = parseMes(result.data);
      if (type == "init") {
        useStore.setState({ rootLoading: false });
        init(JSON.parse(data), ws);
      } else if (type == "update") {
        useStore.setState({ rootLoading: false });
        update(JSON.parse(data), ws);
      } else if (type == "size") {
        useStore.setState({ sizeLoading: false });
        setSize(JSON.parse(data));
      }
    });
  });
  ws.addEventListener("error", () => {
    console.error("连接异常");
  });
  ws.addEventListener("close", () => {
    console.error("连接断开");
  });
}
function parseMes(mes: string) {
  return JSON.parse(mes);
}
