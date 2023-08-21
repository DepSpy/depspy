import { MouseEventHandler, ReactElement } from "react";
import { Data } from "../types";
import { context } from "./context";
interface DrawStoreProps {
  children: ReactElement;
  value: (data: Data) => MouseEventHandler<HTMLDivElement>;
}
const DrawStore = ({ children, value }: DrawStoreProps) => {
  return <context.Provider value={value}>{children}</context.Provider>;
};
export default DrawStore;
