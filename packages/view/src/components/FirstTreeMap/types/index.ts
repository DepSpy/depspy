import { ReactElement } from "react";

// import { Node } from "../../../../types/types";
export interface Data {
  name: string;
  children?: Data[] | Record<string, Data[]>;
  _children?: Data[] | Record<string, Data[]>;
  size?: number;
  _size?: number;
  [x: string]: string | Data[] | Record<string, Data[]> | number;
}
export interface DrawSVGProps {
  // jsonData: Node;
  hiddenWidthMultiplier?: number;
  hiddenHeightMultiplier?: number;
  width?: number;
  height?: number;
  margin?: number;
  padding?: number;
  RectFontSize?: number;
  fullScreen?: boolean;
  loading?: ReactElement;
}
// export interface JSONData {
//   name: string;
//   dependencies: JSONData | Record<string, never>;
//   version: string;
//   size: number;
// }
