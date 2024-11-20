import { getNodeByPaths } from "@/contexts/eventBus";
import { useStore } from "../../../contexts";
import DrawerBox from "../DrawerBox";

export default function CircleDepList() {
  const {
    root,
    circularDependency,
    selectedCircularDependency,
    setSelectCircularDependency,
    setRoot,
  } = useStore((state) => state);
  return (
    <div>
      <DrawerBox
        title={"Circular Dependency"}
        dependencies={circularDependency}
        selectedNode={selectedCircularDependency}
        setFn={async (node) => {
          if (!node) {
            setSelectCircularDependency(null);
            setRoot({ ...root });
            return;
          }
          const paths = [node.circlePath];
          await getNodeByPaths(root, paths);
          setSelectCircularDependency(node);
          setRoot({ ...root });
        }}
      />
    </div>
  );
}
