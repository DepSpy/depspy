export default {
  depth: 3,
  size: false,
  entry: "",
  command: "pnpm run build",
  output: {
    graph: "ds.graph.json",
    staticGraph: "ds.static.json",
    circularDependency: "ds.circular.json",
    codependency: "ds.co.json",
  },
};
