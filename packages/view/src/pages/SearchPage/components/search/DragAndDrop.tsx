import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import "./DragAndDrop.scss";
import { generateGraphWrapper } from "../../util/GenerateGraphWrapper";
import { useNavigate } from "react-router-dom";

interface DragAndDropProps {
  onHideDragAndDrop: () => void;
}

const DragAndDrop: React.FC<DragAndDropProps> = ({ onHideDragAndDrop }) => {
  const navigate = useNavigate();

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
      navigate("/analyze");
    }
  }, [parsedData]);

  return (
    <div className={"mainpage"}>
      <div className={"content-area"}>
        <section className={"droparea"}>
          <div className={"draganddrop-header"}>
            <p className={"title"}>Upload package.json File</p>
            <i className={"close-button"} onClick={onHideDragAndDrop}>
              x
            </i>
          </div>
          <div {...getRootProps({ className: "border" })}>
            <input {...getInputProps()} />
            <i className={"icon"}>x</i>
            <p className={"text"}>
              Drag 'n' drop some files here, or click to select files
            </p>
            <em className={"text-type"}>(Only *.json file will be accepted)</em>
          </div>
        </section>
      </div>
      <div className={"overlay"} onClick={onHideDragAndDrop}></div>
    </div>
  );
};

export default DragAndDrop;
