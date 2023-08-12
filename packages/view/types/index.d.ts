declare module "virtual:graph-data" {
  const graph: {
    root?: import("./types").Node;
    codependency?: import("./types").Node[];
    circularDependency?: import("./types").Node[];
  };
  export { graph };
}
