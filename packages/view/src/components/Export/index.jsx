import * as d3 from "d3";
import { useRef } from "react";
import { useStore } from "@/contexts";
import useLanguage from "@/i18n/hooks/useLanguage";
import saveSvg from "save-svg-as-png";
import "./index.scss";

export function Export({ svgRef, width, height, json }) {
  const { t } = useLanguage();
  let { current } = useRef({
    fileTypeRef: "",
  });
  const [depth] = useStore((state) => [state.depth, state.setDepth]);
  const { collapse } = useStore((state) => ({
    collapse: state.collapse,
    setCollapse: state.setCollapse,
  }));
  const handleSelectChange = () => {
    const select = document.getElementsByTagName("select")[0];
    const selectedType = select.options[select.selectedIndex].value;
    current.fileTypeRef = selectedType;
  };
  // 缩放获取完整svg d3 矢量
  const zoomScreen = (type, sb = {}) => {
    function zoomed(e) {
      d3.selectAll("#resizing").attr("transform", e.transform);
    }
    const zoom = d3.zoom().on("zoom", zoomed);
    if (type == "Full") {
      const divide = collapse ? 1 : depth < 3 ? 1 : Math.pow(2.1, depth);
      d3.select(svgRef.current).call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / sb.width, height / (100 / divide))
          .scale(0.01),
      );
    } else if (type == "Reset")
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
    const svgDom = document.querySelector("svg");
    const sb = svgDom.getBBox();
    zoomScreen("Full", sb);
    const toExport = svgDom.cloneNode(true);
    const bb = svgDom.getBBox();
    console.log(sb, bb);
    const serializer = new XMLSerializer();
    toExport.setAttribute(
      "viewBox",
      bb.x + " " + bb.y + " " + bb.width + " " + bb.height,
    );
    toExport.setAttribute("width", bb.width * 250);
    toExport.setAttribute("height", bb.height * 250);
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
    const svgDom = document.querySelector("svg");
    const sb = svgDom.getBBox();
    zoomScreen("Full", sb);
    const toExport = svgDom.cloneNode(true);
    const bb = svgDom.getBBox();
    const view = `${bb.x * 50} ${bb.y * 50} ${bb.width * 1.2} ${
      bb.height * 1.3
    }`;
    toExport.setAttribute("viewBox", view);
    toExport.setAttribute("width", bb.width * 250);
    toExport.setAttribute("height", bb.height * 250);
    saveSvg.saveSvgAsPng(
      toExport,
      `${json.name}${t("section.dependences")}.${format}`,
      { scale: 80 },
    );
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
