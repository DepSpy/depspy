import React, { useState } from "react";
import SearchBar from "./SearchBar";
import SwitchButton from "./SwitchButton";

interface SearchSectionProps {
  onDisplayDragAndDrop: () => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  onDisplayDragAndDrop,
}) => {
  const [showButton, setShowButton] = useState<boolean>(true);

  const showButtonHandler = () => {
    setShowButton(true);
  };

  const hideButtonHandler = () => {
    setShowButton(false);
  };

  return (
    <>
      <SearchBar
        onShowButton={showButtonHandler}
        onHideButton={hideButtonHandler}
      />
      {showButton && (
        <SwitchButton onDisplayDragAndDrop={onDisplayDragAndDrop} />
      )}
    </>
  );
};

export default SearchSection;
