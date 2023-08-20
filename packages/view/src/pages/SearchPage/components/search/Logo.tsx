import React, { ReactNode } from "react";
import classes from "./Logo.module.css";

interface LayoutProps {
  children: ReactNode;
}

const Logo: React.FC<LayoutProps> = () => {
  return (
    <div>
      <main className={classes.logo}>DevSpy</main>
    </div>
  );
};

export default Logo;
