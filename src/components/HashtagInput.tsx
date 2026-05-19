"use client";
import { useState, KeyboardEvent, useRef, useEffect } from "react";

const MAX_TAG_LENGTH = 40;
const DEFAULT_MAX_TAGS = 30;

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function HashtagInput({ value, onChange, placeholder, maxTags = DEFAULT_MAX_TAGS }: Props) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (suggestTimer.current) clearTimeout(suggestTimer.current); };
  }, []);

  function fetchSuggestions(token: string) {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (token.length < 2) { setSuggestions([]); return; }
    suggestTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/suggest?q=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data: { name: string }[] = await res.json();
        setSuggestions(data.map((d) => d.name).filter((n) => !value.includes(n)));
      }
    }, 200);
  }

  function addTag(raw: string) {
    const cleaned = raw.trim().toLowerCase().replace(/^#+/, "").replace(/[^a-z0-9_]/g, "").slice(0, MAX_TAG_LENGTH);
    if (cleaned && !value.includes(cleaned) && value.length < maxTags) {
      onChange([...value, cleaned]);
    }
    setInput("");
    setSuggestions([]);
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length) {
      onChange(value.slice(0, -1));
    } else if (e.key === "Escape") {
      setSuggestions([]);
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleBlur() {
    setTimeout(() => { setShowSuggestions(false); setSuggestions([]); }, 150);
    if (input.trim()) addTag(input);
  }

  const atLimit = value.length >= maxTags;

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg min-h-[44px] focus-within:ring-2 focus-within:ring-indigo-500 bg-white">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-sm px-2 py-0.5 rounded-full"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-indigo-400 hover:text-indigo-700 leading-none"
            >
              ×
            </button>
          </span>
        ))}
        {!atLimit && (
          <input
            type="text"
            value={input}
            onChange={(e) => {
              const val = e.target.value;
              setInput(val);
              const token = val.replace(/^#/, "");
              fetchSuggestions(token);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKey}
            onFocus={() => setShowSuggestions(true)}
            onBlur={handleBlur}
            placeholder={value.length === 0 ? (placeholder ?? "Type a hashtag and press Enter…") : ""}
            className="flex-1 min-w-[140px] outline-none text-sm py-0.5 bg-transparent"
          />
        )}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-gray-400 mt-1 text-right">
          {value.length}/{maxTags} tags
          {atLimit && <span className="text-amber-500 ml-1">· limit reached</span>}
        </p>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
          {suggestions.slice(0, 6).map((name) => (
            <button
              key={name}
              type="button"
              onMouseDown={() => { addTag(name); setShowSuggestions(false); }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
            >
              #{name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
