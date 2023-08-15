import { MouseEventHandler, createContext } from "react";
import { Data } from "../types";

export const context = createContext<
  ((data: Data) => MouseEventHandler<HTMLDivElement>) | null
>(null);
