import "./Logo.scss";
import logoLight from "../../assets/logo_light_large.svg";
import logoDark from "../../assets/logo_dark_large.svg";
import { useStore } from "../../../../contexts";

const Logo = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { theme, setTheme } = useStore();

  return (
    <div className={"logo-area"}>
      <img
        className={"logo-body"}
        src={theme === "light" ? logoLight : logoDark}
        alt="depspy logo for the search page"
      />
    </div>
  );
};

export default Logo;
