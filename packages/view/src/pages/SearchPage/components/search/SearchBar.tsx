import { useContext, useState, useEffect, useRef } from "react";
import Autosuggest, { ChangeEvent } from "react-autosuggest";
import theme from "./theme.module.scss";
import MainPageContext from "../store/MainPageContext";
import fetchPackageNames from "../../util/FetchPackageNames";
import { generateGraphWrapper } from "../../util/GenerateGraphWrapper";
import { debounce } from "lodash-es";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/contexts";

interface SearchBarProps {
  onShowButton: () => void;
  onHideButton: () => void;
  onNewValue: (newValue: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onShowButton,
  onHideButton,
  onNewValue,
}) => {
  const ctx = useContext(MainPageContext);
  const navigate = useNavigate();
  const setInfo = useStore((state) => state.setInfo);
  let suggestionSelected = false;

  const language = ctx.t("mode.language") as string;
  const [value, setValue] = useState<string>("");
  const [suggestions, setSuggestions] = useState<
    Array<{ name: string; description: string; version: string }>
  >([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const sendQuery = (val: string) => {
    ctx.onHistoryUpdate(val);
    generateGraphWrapper(val);
    navigate(`/analyze?q=${val}`);
    setInfo(val);
  };

  const suggestionsFetchRequestedHandler = async ({ value }) => {
    const trimmedInputValue = value.trim().toLowerCase();

    try {
      const newSuggestions = await fetchPackageNames(trimmedInputValue);
      if (newSuggestions.length === 0) {
        onShowButton();
      } else {
        onHideButton();
      }

      setSuggestions(newSuggestions);
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
    const newVal = suggestion.name;
    setValue(newVal);
    setSelectedSuggestionIndex(-1);
    onShowButton();
    suggestionSelected = true;
    sendQuery(newVal);
  };

  const getSuggestionValueHandler = (suggestion: string): string => suggestion;

  const renderSuggestionHandler = (
    suggestion: {
      name: string;
      description: string;
      version: string;
    },
    isHighlighted: boolean,
  ) => {
    const suggestionClasses = isHighlighted
      ? `${theme.suggestion} ${theme.selected}`
      : theme.suggestion;

    return (
      <div className={suggestionClasses}>
        <div className={theme.leftsection}>
          <div className={theme.name}>{suggestion.name}</div>
          <div className={theme.description}>{suggestion.description}</div>
        </div>
        <div className={theme.version}>{suggestion.version}</div>
      </div>
    );
  };

  const inputProps = {
    placeholder:
      language === "ENGLISH" ? "Search dependencies" : "请输入依赖名",
    value,
    onChange: async (
      event: React.FormEvent<HTMLElement>,
      { newValue, method }: ChangeEvent,
    ) => {
      if (method === "type") {
        onNewValue(newValue);
        setValue(newValue);

        if (newValue.trim() === "") {
          onShowButton();
        } else {
          onHideButton();
        }
      } else if (method === "up") {
        if (selectedSuggestionIndex > 0) {
          setSelectedSuggestionIndex(selectedSuggestionIndex - 1);
        }
      } else if (method === "down") {
        if (selectedSuggestionIndex < suggestions.length - 1) {
          setSelectedSuggestionIndex(selectedSuggestionIndex + 1);
        }
      }
    },

    onBlur: () => {
      onShowButton();
    },

    onKeyDown: async (event) => {
      if (event.key === "Enter" && !suggestionSelected) {
        const trimmedInputValue = value.trim().toLowerCase();
        if (trimmedInputValue === "") {
          console.log("Can't search empty dependency");
          return;
        }
        const pendingDependency = await fetchPackageNames(trimmedInputValue);
        if (pendingDependency.length !== 0) {
          sendQuery(trimmedInputValue);
        } else {
          console.log("Non-exist dependency, please search another one");
          return;
        }
      } else if (event.key === "Escape") {
        onShowButton();
      }
      suggestionSelected = false;
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
        onSuggestionsFetchRequested={debouncedSuggestionsFetch}
        onSuggestionsClearRequested={suggestionsClearRequestedHandler}
        onSuggestionSelected={suggestionSelectedHandler}
        getSuggestionValue={getSuggestionValueHandler}
        renderInputComponent={renderInputComponentHandler}
        renderSuggestion={(suggestion, { isHighlighted }) =>
          renderSuggestionHandler(suggestion, isHighlighted)
        }
        inputProps={inputProps}
      />
    </div>
  );
};
export default SearchBar;
