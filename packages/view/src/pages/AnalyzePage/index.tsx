import { Tree } from "../../components/Tree";
import { useStore } from "../../contexts";
import Sidebar from "./Sidebar";

export default function AnalyzePage() {
  const root = useStore((state) => state.root);
  return (
    <div className="h-screen overflow-hidden">
      <Tree originalData={root}></Tree>
      <Sidebar />
    </div>
  );
}
