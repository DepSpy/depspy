import { Store } from "~/types";
import type { StoreApi } from "zustand";
import { EventBus } from "./eventBus";
import { useStaticStore } from "./index";

export async function linkContext(useStore: StoreApi<Store>) {
  useStore.setState({
    rootLoading: true,
  });
  useStaticStore.setState({
    staticRootLoading: true,
  });
  const query = new URLSearchParams(window.location.search);
  await EventBus.init({
    depth: Number(query.get("depth")) || 3,
  });
}
