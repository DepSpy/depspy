// import html2canvas from "html2canvas";
// import canvg from "canvg";
import * as d3 from "d3";
import "./index.scss";

export function Export({ svgRef, width, height, ZOOM }) {
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
    const svg = document.querySelector("svg");
    const source = new XMLSerializer().serializeToString(svg); //将整个SVG document 对象序列化为一个 XML 字符串。
    onDownload(source, "text/xml", "test.svg"); // 下载
    zoomScreen("Reset");
  }

  const onSaveImage = (format) => {
    zoomScreen("Full");
    const svgDom = document.querySelector("svg");
    const serializer = new XMLSerializer();
    const toExport = svgDom.cloneNode(true);
    const bb = svgDom.getBBox();
    console.log(bb);
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
      a.download = `导出依赖.${format}`;
      a.href = canvas.toDataURL(`image/${format}`);
      a.click();
    };
    zoomScreen("Reset");
  };

  return (
    <>
      <div className="flex bottom-bar">
        <button className="bottom-btn">{`ZOOM:${
          ZOOM.k == 1 ? "1.00" : ZOOM.k
        }`}</button>
        <button
          className="bottom-btn"
          onClick={() => {
            onSaveSvg();
          }}
        >
          SVG
        </button>
        <button
          className="bottom-btn"
          onClick={() => {
            onSaveImage("png");
          }}
        >
          PNG
        </button>
      </div>
    </>
  );
}
