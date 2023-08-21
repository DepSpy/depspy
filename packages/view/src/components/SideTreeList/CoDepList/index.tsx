import { useMemo } from "react";
import { useStore } from "../../../contexts";
import DrawerBox from "../DrawerBox";

export default function CoDepList() {
  const { codependency, selectedCodependency, setSelectCodependency } =
    useStore((state) => state);
  const dependencies = useMemo(() => {
    return Object.values(codependency).map((nodes) => {
      return nodes[0];
    });
  }, [codependency]);
  return (
    <div>
      <DrawerBox
        title={"Duplicated Dependency"}
        dependencies={dependencies}
        selectedNode={selectedCodependency[0]}
        setFn={(node) => {
          setSelectCodependency(codependency[node.name + node.version]);
        }}
      />
    </div>
  );
}
