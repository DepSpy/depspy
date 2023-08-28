import { useStore } from "@/contexts";

export default function Back() {
  const setPreSelectNode = useStore((state) => state.setPreSelectNode);
  return (
    <div
      className="flex 
           m-b-2 p-2 
           bg-bg-container
           border border-solid border-border rounded-full hover:border-primary-base"
      onClick={() => {
        setPreSelectNode();
      }}
    >
      <div className="i-carbon-direction-loop-left text-icon"></div>
    </div>
  );
}
