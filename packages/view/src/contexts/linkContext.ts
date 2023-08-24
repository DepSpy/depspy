import { generateGraphRes } from "~/types";
const online = new URL(location.href).hostname !== "localhost";
const wsPath = "ws://localhost:822";
export function linkContext(
  init: (data: generateGraphRes, ws: WebSocket) => void,
  update: (data: generateGraphRes, ws: WebSocket) => void,
) {
  if (!online) {
    const ws = new WebSocket(wsPath);

    ws.addEventListener("open", () => {
      ws.addEventListener("message", (result) => {
        const { type, data } = parseMes(result.data);
        if (type == "init") {
          init(JSON.parse(data), ws);
        } else {
          update(JSON.parse(data), ws);
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
}
function parseMes(mes: string) {
  return JSON.parse(mes);
}
