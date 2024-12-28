// import * as G6 from "@antv/g6";
import { useRef } from "react";
import { useStore } from "@/contexts";
import CanvasToSVG from "canvas-to-svg";
import { useStore } from "../../contexts";
import useLanguage from "@/i18n/hooks/useLanguage";

export function Export({ json, treeRef }) {
  const { t } = useLanguage();
  const { theme } = useStore();
  const { current } = useRef({
    fileTypeRef: "",
  });
  //   const { collapse } = useStore((state) => ({
  //     collapse: state.collapse,
  //     setCollapse: state.setCollapse,
  //   }));
  const handleSelectChange = () => {
    const select = document.getElementsByTagName("select")[0];
    const selectedType = select.options[select.selectedIndex].value;
    current.fileTypeRef = selectedType;
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
    const graph = treeRef.current.graph;
    downloadFullImageSVG(graph, json.name, undefined, {
      backgroundColor: theme === "light" ? "white" : "black",
    });
  }
  function downloadFullImageSVG(graphInstance, name, type, imageConfig) {
    graphInstance?.toFullDataURL(
      (res) => {
        const image = new Image();
        image.src = res;
        image.onload = function () {
          const context = new CanvasToSVG(image.width, image.height);
          if (context) {
            context.rect(0, 0, image.width, image.height);
            context.drawImage(image, 0, 0, image.width, image.height);
            const svg = context.getSerializedSvg(true);
            onDownload(svg, "image/svg", json.name + ".svg");
          }
        };
      },
      type,
      imageConfig,
    );
  }
  const onSaveImage = (format) => {
    const graph = treeRef.current.graph;
    graph.downloadFullImage(
      `${json.name}${t("section.dependences")}`,
      `image/${format}`,
      {
        backgroundColor: theme === "light" ? "white" : "black",
      },
    );
  };
  const onSaveJson = () => {
    if (json) {
      const link = document.createElement("a");
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
        <div className="flex flex-items-end exporter align-middle">
          <div
            id={`${t("section.fileType")}`}
            className={`relative
      hover:after:(absolute flex c-primary-hover text-nowrap left-50% transform-translate-x--50%
      content-[attr(id)])`}
          >
            <select
              className="flex w-20 h-8 lh-8 bg-bg-container text-text text-center"
              border="solid 2 rd-0.5rem primary-border-hover"
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
          </div>
          <div
            id={`${t("section.export")}`}
            className={`relative p-l-3
      hover:after:(absolute flex c-primary-hover text-nowrap left-50% transform-translate-x--50%
      content-[attr(id)])`}
          >
            <div
              className="flex flex-row fs-24 c-primary-border-hover"
              onClick={handleDownload}
            >
              <div
                className={`
              i-carbon-logout
              text-1.5rem `}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
