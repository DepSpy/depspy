import { useEffect, useState } from "react";

export default function Toast({ title, description, back }) {
  const [isShow, setIsShow] = useState(true);

  // 3s后自动消失
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShow(false);
      back();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed top-10 z-50 bg-bg-layout text-text rounded-3 w-80 ${
        isShow ? "animate-fade-in-down" : "animate-fade-out-up"
      }`}
    >
      <div className="flex flex-col gap-2 p-4">
        <div className="flex flex-row gap-2 items-center">
          <div className="w-8 h-4 bg-primary-base rounded-full"></div>
          <div className="text-sm text-primary-base">{title}</div>
        </div>
        <div className="text-sm">{description}</div>
      </div>
    </div>
  );
}
