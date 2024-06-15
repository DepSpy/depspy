import { generateGraph } from "@dep-spy/core";

for (let i = 0; i < 100; i++) {
  const graph = generateGraph("info", {
    depth: 30,
    size: false,
    entry: null,
    output: {
      graph: "ds.graph.json",
      staticGraph: "ds.static.json",
      circularDependency: "ds.circular.json",
      codependency: "ds.co.json",
    },
  });
  graph.getGraph();
  console.log(1);
}
