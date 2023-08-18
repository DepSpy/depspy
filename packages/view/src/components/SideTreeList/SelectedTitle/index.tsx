import { useStore } from "../../../contexts";
import "./index.scss";

export default function SelectedTitle() {
  const { selectedNode } = useStore((state) => state);
  return (
    <div className="treelist-selected-title">
      <div>SELECTED:</div>
      <div>
        {selectedNode.name}@
        {selectedNode.declarationVersion || selectedNode.version}
      </div>
    </div>
  );
}
