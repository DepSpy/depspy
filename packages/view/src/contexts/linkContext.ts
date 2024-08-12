import { Store } from "~/types";
import type { StoreApi } from "zustand";
import { compose, toInfinity } from "@dep-spy/utils";
import { EventBus } from "./eventBus";
import { useStaticStore } from "./index";
import { getNode, circularDependency as getCirDep,codependency as getCodep } from "./api";

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
  const root = await getNode({});
  const circularDependency = await getCirDep();
  const codependency = await getCodep();
  const data = {
    root,
    circularDependency,
    codependency,
    depth: 3
  };
  console.log(data);

  EventBus["init"](data);
  //   ws.addEventListener("message", (result) => {
  //     const { type, data } = parseMes(result.data);
  //     console.log('wsType', type);

  //     EventBus[type](
  //       typeof data === "string"
  //         ? parseMes(data)
  //         : data,
  //       ws,
  //     );
  //   });
  // });
  // ws.addEventListener("error", () => {
  //   console.error("连接异常");
  // });
  // ws.addEventListener("close", () => {
  //   console.error("连接断开");
  // });

  // window.addEventListener("beforeunload", () => ws.close());
}

function parseMes(mes: string) {
  return JSON.parse(mes, compose([toInfinity]));
}
