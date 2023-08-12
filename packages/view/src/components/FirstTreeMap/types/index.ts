import { Node } from "../../../../types/types";
export interface Data {
  name: string;
  children?: Data[] | Record<string, never>;
  _children?: Data[] | Record<string, never>;
  size?: number;
  _size?: number;
}
export interface DrawSVGProps {
  jsonData: Node;
  width?: number;
  height?: number;
  margin?: number;
}
// export interface JSONData {
//   name: string;
//   dependencies: JSONData | Record<string, never>;
//   version: string;
//   size: number;
// }
