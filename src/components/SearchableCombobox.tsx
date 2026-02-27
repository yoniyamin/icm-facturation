"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Plus } from "lucide-react";

export interface ComboboxItem {
  value: string;
  label: string;
}

interface SearchableComboboxProps {
  items: ComboboxItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowNew?: boolean;
  newItemLabel?: (name: string) => string;
  disabled?: boolean;
  hasError?: boolean;
  onBlur?: () => void;
}

export default function SearchableCombobox({
  items,
  value,
  onChange,
  placeholder = "",
  allowNew = false,
  newItemLabel,
  disabled = false,
  hasError = false,
  onBlur,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayLabel =
    items.find((item) => item.value === value)?.label ?? value;

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = items.some(
    (item) => item.label.toLowerCase() === search.toLowerCase()
  );
  const showNewOption =
    allowNew && search.trim() && !exactMatch;

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setSearch("");
      setOpen(false);
      inputRef.current?.blur();
    },
    [onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (!open) setOpen(true);
  };

  const handleFocus = () => {
    setSearch("");
    setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      setSearch("");
      inputRef.current?.blur();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length === 1) {
        handleSelect(filtered[0].value);
      } else if (showNewOption) {
        handleSelect(search.trim());
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onBlur]);

  const inputClass = `w-full rounded-xl border-2 px-4 py-3 pe-10 text-sm transition-colors outline-none ${
    hasError
      ? "border-red-300 bg-red-50 focus:border-red-500"
      : "border-primary-200 bg-white focus:border-primary-500 focus:bg-white"
  }`;

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={open ? search : displayLabel}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={inputClass}
        disabled={disabled}
        autoComplete="off"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => {
          if (!disabled) {
            setOpen(!open);
            if (!open) inputRef.current?.focus();
          }
        }}
        className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400"
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
          {filtered.map((item) => (
            <li key={item.value}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item.value)}
                className={`flex w-full items-center px-4 py-2.5 text-start text-sm transition-colors hover:bg-primary-50 ${
                  item.value === value
                    ? "bg-primary-50 font-semibold text-primary-700"
                    : "text-gray-700"
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
          {showNewOption && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(search.trim())}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-start text-sm text-accent-600 transition-colors hover:bg-accent-50"
              >
                <Plus className="h-4 w-4" />
                {newItemLabel
                  ? newItemLabel(search.trim())
                  : search.trim()}
              </button>
            </li>
          )}
          {filtered.length === 0 && !showNewOption && (
            <li className="px-4 py-2.5 text-sm text-gray-400">—</li>
          )}
        </ul>
      )}
    </div>
  );
}
