import React, { useState } from "react";
import SearchBar from "./SearchBar";
import SwitchButton from "./SwitchButton";

interface SearchSectionProps {
  names: string[];
  onDisplayDragAndDrop: () => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  names,
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
        names={names}
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
