import { Node } from "~/types";

export interface StateType {
  keywords: string;
  loading: boolean;
  nodes: Node[];
  searchHistory: string[];
}
export interface ActionType {
  type: keyof StateType;
  value?: StateType[keyof StateType];
}
export interface ReducerType {
  (state: StateType, action: ActionType | ActionType[]): StateType;
}
