import FirstTreeMap from "../../components/FirstTreeMap";
import { Tree } from "../../components/Tree";
import { graph } from "virtual:graph-data";
export default function AnalyzePage() {
  console.log(graph.root);

  return (
    <>
      <Tree originalData={graph.root}></Tree>
      <FirstTreeMap jsonData={graph.root}></FirstTreeMap>
    </>
  );
}
