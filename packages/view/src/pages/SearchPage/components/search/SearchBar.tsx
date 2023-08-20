// SearchBar.tsx
import React, { useContext, useEffect, useRef, useState } from "react";
import Autosuggest, { ChangeEvent } from "react-autosuggest";
import theme from "./theme.module.css";
import MainPageContext from "../store/MainPageContext";

interface SearchBarProps {
  names: string[];
  onShowButton: () => void;
  onHideButton: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  names,
  onShowButton,
  onHideButton,
}) => {
  const ctx = useContext(MainPageContext);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const getSuggestions = (inputValue: string): string[] => {
    const trimmedInputValue = inputValue.trim().toLowerCase();
    const inputLength = trimmedInputValue.length;

    return inputLength === 0
      ? []
      : names
        .filter(
          (name) =>
            name.toLowerCase().slice(0, inputLength) === trimmedInputValue
        )
        .sort((a, b) => a.length - b.length)
        .slice(0, 11);
  };

  const clickOutsideHandler = (event: MouseEvent) => {
    if (
      searchBarRef.current &&
      !searchBarRef.current.contains(event.target as Node)
    ) {
      onShowButton();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", clickOutsideHandler);
    return () => {
      document.removeEventListener("mousedown", clickOutsideHandler);
    };
  }, []);

  const suggestionsFetchRequestedHandler = ({ value }: { value: string }) => {
    const newSuggestions = getSuggestions(value);
    setSuggestions(newSuggestions);

    if (newSuggestions.length === 0) {
      onShowButton();
    } else {
      onHideButton();
    }
  };

  const suggestionsClearRequestedHandler = () => {
    setSuggestions([]);
  };

  const suggestionSelectedHandler = (
    event: React.FormEvent<any>,
    { suggestion }: { suggestion: string }
  ) => {
    setValue(suggestion);
    onShowButton();
    ctx.onHistoryCollection(suggestion);
  };

  const getSuggestionValueHandler = (suggestion: string): string => suggestion;

  const renderSuggestionHandler = (suggestion: string) => (
    <div>{suggestion}</div>
  );

  const inputProps = {
    placeholder: "Search packages",
    value,
    onChange: (
      event: React.FormEvent<HTMLElement>,
      { newValue }: ChangeEvent
    ) => {
      setValue(newValue);
      if (newValue === "") {
        onShowButton();
      } else {
        onHideButton();
      }
    },
  };

  return (
    <div className={theme.mainpage} ref={searchBarRef}>
      <Autosuggest
        theme={theme}
        suggestions={suggestions}
        onSuggestionsFetchRequested={suggestionsFetchRequestedHandler}
        onSuggestionsClearRequested={suggestionsClearRequestedHandler}
        onSuggestionSelected={suggestionSelectedHandler}
        getSuggestionValue={getSuggestionValueHandler}
        renderSuggestion={renderSuggestionHandler}
        inputProps={inputProps}
        highlightFirstSuggestion={false}
      />
    </div>
  );
};

export default SearchBar;
