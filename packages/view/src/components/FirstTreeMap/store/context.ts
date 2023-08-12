import { MouseEventHandler, createContext } from "react";
import { Data } from "..";

export const context = createContext<
  ((data: Data) => MouseEventHandler<HTMLDivElement>) | null
>(null);
