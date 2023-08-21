import React, { ReactNode } from "react";
import MainNavigation from "./MainNavigation";
import "./Header.scss";

interface HeaderProps {
  children: ReactNode;
}

const Layout: React.FC<HeaderProps> = (props) => {
  return (
    <div>
      <MainNavigation
      />
      <main className={"main"}>{props.children}</main>
    </div>
  );
};

export default Layout;
