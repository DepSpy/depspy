import { useMemo } from "react";
import { useStore } from "../../../contexts";
import DrawerBox from "../DrawerBox";
import { getNodeByPaths } from "@/contexts/eventBus";

export default function CoDepList() {
  const {
    root,
    codependency,
    selectedCodependency,
    setSelectCodependency,
    setRoot,
  } = useStore((state) => state);
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
        setFn={async (node) => {
          if (node === null) {
            setSelectCodependency([]);
            return;
          }
          const paths = Object.values(
            codependency[node.name + node.declarationVersion],
          ).map((coNode) => {
            const paths = coNode.path;
            return paths;
          });
          await getNodeByPaths(root, paths);
          // for (const coNode of Object.values(
          //   codependency[node.name + node.declarationVersion],
          // )) {
          //   const paths = coNode.path;
          //   await getNodeByPaths(root, paths);
          // }

          setSelectCodependency(
            codependency[node.name + node.declarationVersion],
          );
          setRoot({ ...root });
          console.log(root, "asfasfasf");
        }}
      />
    </div>
  );
}
