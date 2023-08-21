import React, { ReactNode } from "react";
import "./Logo.scss";

interface LayoutProps {
  children: ReactNode;
}

const Logo: React.FC<LayoutProps> = () => {
  return (
    <div>
      <main className={"logo"}>DevSpy</main>
    </div>
  );
};

export default Logo;
