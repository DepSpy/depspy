// import html2canvas from "html2canvas";
// import canvg from "canvg";
import * as d3 from "d3";
import { useRef } from "react";
import useLanguage from "@/i18n/hooks/useLanguage";
import "./index.scss";

export function Export({ svgRef, width, height, json }) {
  const { t } = useLanguage();
  let { current } = useRef({
    fileTypeRef: "",
  });
  const handleSelectChange = () => {
    const select = document.getElementsByTagName("select")[0];
    const selectedType = select.options[select.selectedIndex].value;
    current.fileTypeRef = selectedType;
  };

  const zoomScreen = (type) => {
    function zoomed(e) {
      d3.selectAll("#resizing").attr("transform", e.transform);
    }
    const zoom = d3.zoom().scaleExtent([1, 0.1]).on("zoom", zoomed);
    if (type == "Full")
      d3.select(svgRef.current).call(
        zoom.transform,
        d3.zoomIdentity.translate(width / 100, height / 100).scale(0.1),
      );
    else if (type == "Reset")
      d3.select(svgRef.current).call(zoom.transform, d3.zoomIdentity);
  };
  const options = [
    {
      val: "json",
      name: ".json",
    },
    {
      val: "svg",
      name: ".svg",
    },
    {
      val: "png",
      name: ".png",
    },
  ];
  function onDownload(data, type, name) {
    const blob = new Blob([data], { type }); // 返回一个新创建的 Blob 对象，其内容由参数中给定的数组串联组成。
    const url = window.URL.createObjectURL(blob); //创建一个url
    const link = document.createElement("a"); //创建一个a标签
    link.href = url; // 把url 赋值给a标签的href
    link.style.display = "none";
    link.setAttribute("download", name);
    document.body.appendChild(link);
    link.click(); // 触发a标签的点击事件
    URL.revokeObjectURL(url); // 清除Url
    document.body.removeChild(link);
  }

  function onSaveSvg() {
    zoomScreen("Full");
    const svgDom = document.querySelector("svg");
    const serializer = new XMLSerializer();
    const toExport = svgDom.cloneNode(true);
    const bb = svgDom.getBBox();
    toExport.setAttribute(
      "viewBox",
      bb.x + " " + bb.y + " " + bb.width + " " + bb.height,
    );
    toExport.setAttribute("width", bb.width);
    toExport.setAttribute("height", bb.height);
    const source =
      '<?xml version="1.0" standalone="no"?>\r\n' +
      serializer.serializeToString(toExport);
    onDownload(
      source,
      "text/xml",
      `${json.name}${t("section.dependences")}.svg`,
    ); // 下载
    zoomScreen("Reset");
  }

  const onSaveImage = (format) => {
    zoomScreen("Full");
    const svgDom = document.querySelector("svg");
    const serializer = new XMLSerializer();
    const toExport = svgDom.cloneNode(true);
    const bb = svgDom.getBBox();
    toExport.setAttribute(
      "viewBox",
      bb.x + " " + bb.y + " " + bb.width * 200 + " " + bb.height * 200,
    );
    toExport.setAttribute("width", bb.width * 200);
    toExport.setAttribute("height", bb.height * 200);
    const source =
      '<?xml version="1.0" standalone="no"?>\r\n' +
      serializer.serializeToString(toExport);
    const image = new Image();
    image.src =
      "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    const canvas = document.createElement("canvas");
    canvas.width = bb.width;
    canvas.height = bb.height;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff"; //#fff设置保存后的PNG 是白色的
    context.fillRect(0, 0, 10000, 10000);
    image.onload = function () {
      context.drawImage(image, 0, 0);
      var a = document.createElement("a");
      a.download = `${json.name}${t("section.dependences")}.${format}`;
      a.href = canvas.toDataURL(`image/${format}`);
      a.click();
    };
    zoomScreen("Reset");
  };
  const onSaveJson = () => {
    if (json) {
      let link = document.createElement("a");
      link.download = `${json.name}${t("section.dependences")}.json`;
      link.href = "data:text/plain," + JSON.stringify(json);
      link.click();
    } else alert(`${t("section.jsonexp")}`);
  };

  const handleDownload = () => {
    switch (current.fileTypeRef) {
      case "json":
        onSaveJson();
        break;
      case "svg":
        onSaveSvg();
        break;
      case "png":
        onSaveImage("png");
        break;
      default:
        alert(`${t("section.alertexp")}`);
    }
  };
  return (
    <>
      <div>
        <div className="flex exporter">
          <select
            className="flex w-20 h-8 lh-8"
            border="solid 2 rd-0.5rem primary-border hover:primary-border-hover"
            onChange={handleSelectChange}
          >
            <option value={null} disabled selected hidden>
              {t("section.select")}
            </option>
            {options.map((opt, optId) => {
              return (
                <option value={opt.val} key={`selector-opt-${optId}`}>
                  {opt.name}
                </option>
              );
            })}
          </select>
          <div
            className="flex flex-row fs-24 
            c-primary-border hover:c-primary-border-hover"
            onClick={handleDownload}
          >
            <div> {t("section.export")} </div>
            <div
              className={`
              i-carbon-logout
              text-1.5rem `}
            ></div>
          </div>
        </div>
      </div>
    </>
  );
}
