import { graph } from "virtual:graph-data";

export const isStatic = Object.keys(graph).length === 0;
