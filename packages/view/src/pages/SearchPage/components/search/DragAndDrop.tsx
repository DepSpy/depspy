import { useEffect, useState, useContext } from "react";
import { useDropzone } from "react-dropzone";
import "./DragAndDrop.scss";
import { generateGraphWrapper } from "../../util/GenerateGraphWrapper";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/contexts";
import MainPageContext from "../store/MainPageContext";

interface DragAndDropProps {
  onHideDragAndDrop: () => void;
}

const DragAndDrop: React.FC<DragAndDropProps> = ({ onHideDragAndDrop }) => {
  const ctx = useContext(MainPageContext);
  const navigate = useNavigate();
  const setInfo = useStore((state) => state.setInfo);
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/json": ["json"] },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleFileRead(acceptedFiles[0]);
      }
    },
    useFsAccessApi: false,
  });

  const [parsedData, setParsedData] = useState<unknown | null>(null);

  const handleFileRead = (file: File) => {
    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      const fileContent = event.target?.result as string;
      try {
        const jsonData = JSON.parse(fileContent);
        setParsedData(jsonData);
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };

    reader.readAsText(file);
  };

  useEffect(() => {
    if (parsedData) {
      const graphString = JSON.stringify(parsedData, null, 2);
      generateGraphWrapper(graphString);
      navigate("/analyze?depth=3");
      setInfo(graphString);
    }
  }, [parsedData]);

  return (
    <div className={"mainpage"}>
      <div className={"content-area"}>
        <section className={"droparea"}>
          <div className={"draganddrop-header"}>
            <p className={"title"}>{ctx.t("search.upload")}</p>
            <button className="i-ic-sharp-close" onClick={onHideDragAndDrop} />
          </div>
          <div {...getRootProps({ className: "border" })}>
            <input {...getInputProps()} />
            <div className="i-bi-filetype-json" />
            <p className={"text"}>{ctx.t("search.drag")}</p>
            <em className={"text-type"}>{ctx.t("search.format")}</em>
          </div>
        </section>
      </div>
      <div className={"overlay"} onClick={onHideDragAndDrop}></div>
    </div>
  );
};

export default DragAndDrop;
