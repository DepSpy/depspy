import { useStore } from "../../../contexts";
import DrawerBox from "../DrawerBox";

export default function CoDepList() {
  const { codependency, selectedCodependency, setSelectCodependency } =
    useStore((state) => state);
  return (
    <div>
      <DrawerBox
        title={"Duplicated Dependency"}
        dependencies={codependency}
        selectedNode={selectedCodependency}
        setFn={setSelectCodependency}
      />
    </div>
  );
}
