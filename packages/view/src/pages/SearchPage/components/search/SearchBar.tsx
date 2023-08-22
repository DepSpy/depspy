import { useContext, useState, useEffect, useRef } from "react";
import Autosuggest, { ChangeEvent } from "react-autosuggest";
import theme from "./theme.module.scss";
import MainPageContext from "../store/MainPageContext";
import fetchPackageNames from "../../util/FetchPackageNames";
import debounce from "lodash/debounce";

interface SearchBarProps {
  onShowButton: () => void;
  onHideButton: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onShowButton,
  onHideButton,
}) => {
  const ctx = useContext(MainPageContext);
  const [value, setValue] = useState<string>("");
  const [suggestions, setSuggestions] = useState<
    Array<{ name: string; description: string; version: string }>
  >([]);

  const suggestionsFetchRequestedHandler = async ({
    value,
  }: {
    value: string;
  }) => {
    const trimmedInputValue = value.trim().toLowerCase();
    if (trimmedInputValue === "") {
      return [];
    }

    try {
      const newSuggestions = await fetchPackageNames(trimmedInputValue);
      setSuggestions(newSuggestions);

      if (newSuggestions.length === 0) {
        onShowButton();
      } else {
        onHideButton();
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const debouncedSuggestionsFetch = useRef(
    debounce(suggestionsFetchRequestedHandler, 600),
  ).current;

  useEffect(() => {
    return () => {
      debouncedSuggestionsFetch.cancel();
    };
  }, [debouncedSuggestionsFetch]);

  const suggestionsClearRequestedHandler = () => {
    setSuggestions([]);
  };

  const suggestionSelectedHandler = (
    event,
    {
      suggestion,
    }: { suggestion: { name: string; description: string; version: string } },
  ) => {
    setValue(suggestion.name);
    onShowButton();
    ctx.onHistoryCollection(suggestion.name);
  };

  const getSuggestionValueHandler = (suggestion: string): string => suggestion;

  const renderSuggestionHandler = (suggestion: {
    name: string;
    description: string;
    version: string;
  }) => {
    return (
      <div className={theme.suggestion}>
        <div className={theme.leftsection}>
          <div className={theme.name}>{suggestion.name}</div>
          <div className={theme.description}>{suggestion.description}</div>
        </div>
        <div className={theme.version}>{suggestion.version}</div>
      </div>
    );
  };

  const inputProps = {
    placeholder: "Search packages",
    value,
    onChange: (
      event: React.FormEvent<HTMLElement>,
      { newValue }: ChangeEvent,
    ) => {
      setValue(newValue);
      if (newValue === "") {
        onShowButton();
      } else {
        onHideButton();
      }
      debouncedSuggestionsFetch({ value: newValue });
    },
    onBlur: () => {
      onShowButton();
    },
  };

  const renderInputComponentHandler = (inputProps) => (
    <div className={theme.inputlayout}>
      <div className={theme["i-ic-round-search"]} />
      <input {...inputProps} />
    </div>
  );

  return (
    <div className={theme.mainpage}>
      <Autosuggest
        theme={theme}
        suggestions={suggestions}
        onSuggestionsFetchRequested={suggestionsFetchRequestedHandler}
        onSuggestionsClearRequested={suggestionsClearRequestedHandler}
        onSuggestionSelected={suggestionSelectedHandler}
        getSuggestionValue={getSuggestionValueHandler}
        renderInputComponent={renderInputComponentHandler}
        renderSuggestion={renderSuggestionHandler}
        inputProps={inputProps}
        highlightFirstSuggestion={true}
      />
    </div>
  );
};

export default SearchBar;
