declare module "virtual:graph-data" {
  const graph: {
    root?: import("./types").Node;
    codependency?: Record<string, import("./types").Node[]>;
    circularDependency?: import("./types").Node[];
  };
  export { graph };
}
