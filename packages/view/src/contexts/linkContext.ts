import { Store } from "~/types";
import type { StoreApi } from "zustand";
import { compose, toInfinity } from "@dep-spy/utils";
import { EventBus } from "./eventBus";
import { useStaticStore } from "./index";
import { getNode } from "./api";

// const wsPath = "ws://localhost:1822";

export async function linkContext(useStore: StoreApi<Store>) {
  // const ws = new WebSocket(wsPath);
  // ws.addEventListener("open", () => {
  useStore.setState({
    rootLoading: true,
  });
  useStaticStore.setState({
    staticRootLoading: true,
  });
  // TODO: 从url获取depth
  const query = new URLSearchParams(window.location.search);
  EventBus["init"]({
    depth: Number(query.get("depth")) || 3,
  });
}

function parseMes(mes: string) {
  return JSON.parse(mes, compose([toInfinity]));
}
