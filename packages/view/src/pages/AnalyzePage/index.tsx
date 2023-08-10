import { Tree } from "../../components/Tree";
import { graph } from "virtual:graph-data";
export default function AnalyzePage() {
  return <Tree originalData={graph.root}></Tree>;
}
