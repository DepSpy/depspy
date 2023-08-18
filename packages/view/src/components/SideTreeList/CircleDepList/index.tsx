import { useStore } from "../../../contexts";
import DrawerBox from "../DrawerBox";

export default function CircleDepList() {
  const {
    circularDependency,
    selectedCircularDependency,
    setSelectCircularDependency,
  } = useStore((state) => state);
  return (
    <div>
      <DrawerBox
        title={"Circular Dependency"}
        dependencies={circularDependency}
        selectedNode={selectedCircularDependency}
        setFn={setSelectCircularDependency}
      />
    </div>
  );
}
