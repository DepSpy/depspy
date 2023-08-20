import React, { ReactNode } from "react";
import MainNavigation from "./MainNavigation";
import classes from "./Header.module.css";

interface HeaderProps {
  children: ReactNode;
}

const Layout: React.FC<HeaderProps> = (props) => {
  return (
    <div>
      <MainNavigation
      />
      <main className={classes.main}>{props.children}</main>
    </div>
  );
};

export default Layout;
