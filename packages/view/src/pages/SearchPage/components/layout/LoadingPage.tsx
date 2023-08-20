// LoadingPage.js
import classes from "./LoadingPage.module.css";

const LoadingPage = () => {
  return (
    <div className={classes.loadingContainer}>
      <div className={classes.loadingUI}>Loading...</div>
    </div>
  );
};

export default LoadingPage;
