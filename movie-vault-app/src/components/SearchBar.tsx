import { useState, useEffect, useRef } from "react";
import { useDebounce } from "../hooks/useDebounce";

interface Props {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = "Search movies & shows..." }: Props) {
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, 450);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debouncedValue.trim()) {
      onSearch(debouncedValue.trim());
    }
  }, [debouncedValue, onSearch]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  }

  function handleClear() {
    setValue("");
  }

  return (
    <form className="search-form" onSubmit={handleSubmit} role="search">
      <div className="search-wrap">
        <span className="search-icon">🔍</span>
        <input
          type="search"
          className="search-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label="Search movies and shows"
          autoComplete="off"
        />
        {value && (
          <button type="button" className="search-clear" onClick={handleClear} aria-label="Clear search">
            ✕
          </button>
        )}
      </div>
    </form>
  );
}
