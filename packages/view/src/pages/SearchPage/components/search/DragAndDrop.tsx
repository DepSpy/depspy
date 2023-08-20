import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import classes from "./DragAndDrop.module.css";
import { generateGraphWrapper } from "../../util/GenerateGraphWrapper";
import { useNavigate } from "react-router-dom";

interface DragAndDropProps {
  onHideDragAndDrop: () => void;
}

const DragAndDrop: React.FC<DragAndDropProps> = ({
  onHideDragAndDrop,
}) => {
  const navigate = useNavigate();

  const { acceptedFiles, fileRejections, getRootProps, getInputProps } =
    useDropzone({
      accept: { "application/json": ["json"] },
      onDrop: (acceptedFiles) => {
        if (acceptedFiles.length > 0) {
          handleFileRead(acceptedFiles[0]);
        }
      },
      useFsAccessApi: false
    });

  const [parsedData, setParsedData] = useState<any | null>(null);

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
    <div className={classes.mainpage}>
      <section className={classes.droparea}>
        <button className={classes.backbutton} onClick={onHideDragAndDrop}>
          X
        </button>
        <div {...getRootProps({ className: classes["border"] })}>
          <input {...getInputProps()} />
          <p>Drag 'n' drop some files here, or click to select files</p>
          <em>(Only *.json file will be accepted)</em>
        </div>
      </section>
      <div className={classes.overlay} onClick={onHideDragAndDrop}></div>
    </div>
  );
};

export default DragAndDrop;
