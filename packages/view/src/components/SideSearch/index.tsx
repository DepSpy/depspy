import { useNavigate } from "react-router-dom";

export default function SideSearch() {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/search");
  };
  return (
    <div>
      <div>SideSearch</div>
      <div onClick={() => handleClick()}>back to SearchPage</div>
    </div>
  );
}
