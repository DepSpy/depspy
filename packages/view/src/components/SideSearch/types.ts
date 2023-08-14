export interface StateType {
  keywords: string;
}
export interface ActionType {
  type: "keywords";
  value: StateType[keyof StateType];
}
