const SidebarButton = ({ children, onClick = () => {} }) => {
  return (
    <div
      onClick={onClick}
      className="h-15 min-w-40 m-1 flex items-center justify-center border-solid rounded-3 cursor-pointer"
    >
      {children}
    </div>
  );
};

export default SidebarButton;
