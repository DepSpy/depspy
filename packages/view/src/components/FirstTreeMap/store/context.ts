import { MouseEventHandler, ReactElement, createContext } from "react";
import { Data } from "../types";

export const context = createContext<{
  handle_rect_click: (data: Data) => MouseEventHandler<HTMLDivElement>;
  loading?: ReactElement;
  RectFontSize?: number;
} | null>(null);
