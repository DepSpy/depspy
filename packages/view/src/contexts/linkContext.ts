import { generateGraphRes } from "~/types";
const online = new URL(location.href).hostname !== "localhost";
const wsPath = "ws://localhost:822";
export function linkContext(
  init: (updateDepth: (depth: number) => void) => void,
  update: (result: generateGraphRes) => void,
) {
  if (!online) {
    const ws = new WebSocket(wsPath);
    init((depth: number) => ws.send(depth + ""));
    ws.addEventListener("open", () => {
      ws.addEventListener("message", (result) => {
        update(JSON.parse(result.data));
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
