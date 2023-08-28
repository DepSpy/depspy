import { useStore } from "@/contexts";
import { throttle } from "@/utils/throttle";
import React, { useEffect, useRef, useState } from "react";

function GridBackground() {
  const canvasRef = useRef(null);
  const { theme } = useStore((state) => state);
  const [innerWidth, setInnerWidth] = useState(window.innerWidth);
  const [innerHeight, setInnerHeight] = useState(window.innerHeight);

  useEffect(() => {
    window.addEventListener(
      "resize",
      throttle(() => {
        setInnerWidth(window.innerWidth);
        setInnerHeight(window.innerHeight);
      }),
    );

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // 设置Canvas的宽度和高度
    canvas.width = innerWidth;
    canvas.height = innerHeight;

    // 定义格子的大小和间隔
    const gridSpacing = 30;

    // 绘制格子背景
    if (theme === "light") {
      ctx.strokeStyle = "#000000e0"; // 格子线的颜色
    } else {
      ctx.strokeStyle = "#ffffffd9"; // 格子线的颜色
    }
    ctx.lineWidth = 0.1;

    for (let x = 0; x < canvas.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }, [theme, innerWidth, innerHeight]);

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
}

export default GridBackground;
