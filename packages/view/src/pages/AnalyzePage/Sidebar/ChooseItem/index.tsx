import "./index.scss";

export default function Side({ setShowName, typeName }) {
  function handleClick(name: string) {
    setShowName(name);
  }

  return (
    <div className="sidebar-choose">
      {typeName.map((name: string) => (
        <div
          key={name}
          className="sidebar-choose-item"
          onClick={() => handleClick(name)}
        >
          {name}
        </div>
      ))}
    </div>
  );
}
