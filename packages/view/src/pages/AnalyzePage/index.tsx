import { Tree } from "../../components/Tree";
import { useStore } from "../../contexts";
export default function AnalyzePage() {
  // const root = useStore((state) => {
  //   console.log(state);
  //   return state.root;
  // });
  const root = useStore((state) => state.root);
  return <Tree originalData={root}></Tree>;
}
