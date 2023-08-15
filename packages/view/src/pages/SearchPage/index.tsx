import { useEffect } from "react";
import { generateGraph } from "@dep-spy/core";

export default function SearchPage() {
  useEffect(() => {
    async function generateGraphWrapper() {
      const graph = await generateGraph("vitest");
      console.log(JSON.parse(JSON.stringify(await graph.getGraph())));
    }
    generateGraphWrapper();
  });
  return <div>SearchPage</div>;
}
