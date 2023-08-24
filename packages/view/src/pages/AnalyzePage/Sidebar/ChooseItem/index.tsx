import "./index.scss";

export default function Side({
  setShowName,
  typeName,
  showName,
  setShowSideAll,
  showSideAll,
}) {
  function handleClick(name: string) {
    setShowName(name);
  }

  return (
    <div className="sidebar-choose">
      {typeName.map((name: string) => (
        <div
          key={name}
          className={
            showName === name
              ? "sidebar-choose-item-active"
              : "sidebar-choose-item"
          }
          onClick={() => {
            handleClick(name);
            if (name === showName && showSideAll) {
              setShowSideAll(false);
            } else {
              setShowSideAll(true);
            }
          }}
        >
          {name}
        </div>
      ))}
      <div
        onClick={() => {
          setShowSideAll((showSideAll) => !showSideAll);
        }}
      >
        <div className="rounded-lg border-solid p-1 mt-2 border-border text-icon">
          {showSideAll ? (
            <div className="i-carbon-arrow-right" />
          ) : (
            <div className="i-carbon-arrow-left" />
          )}
        </div>
      </div>
    </div>
  );
}
