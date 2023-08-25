import { MouseEventHandler, ReactElement } from "react";
import { Data } from "../types";
import { context } from "./context";
interface DrawStoreProps {
  children: ReactElement;
  value: {
    handle_rect_click: (data: Data) => MouseEventHandler<HTMLDivElement>;
    loading?: ReactElement;
    RectFontSize?: number;
  };
}
const DrawStore = ({ children, value }: DrawStoreProps) => {
  return <context.Provider value={value}>{children}</context.Provider>;
};
export default DrawStore;
