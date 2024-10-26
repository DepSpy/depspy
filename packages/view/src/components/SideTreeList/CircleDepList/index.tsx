import { getNodeByPaths } from "@/contexts/eventBus";
import { useStore } from "../../../contexts";
import DrawerBox from "../DrawerBox";

export default function CircleDepList() {
  const {
    root,
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
        setFn={async (node) => {
          console.log(node, node.circlePath);
          
          const paths = node.circlePath;
          await getNodeByPaths(root, paths);
          setSelectCircularDependency(node);
        }}
      />
    </div>
  );
}
