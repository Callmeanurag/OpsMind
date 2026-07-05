import { useState } from "react";

interface Props {
  onSearch: (q: string) => void;
}

export default function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  }

  function handleClear() {
    setValue("");
    onSearch(""); // empty string tells Dashboard to reload the full list
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search incidents by keyword..."
        style={inputStyle}
      />
      <button type="submit" style={btnStyle("#0f172a")}>
        Search
      </button>
      {value && (
        <button type="button" onClick={handleClear} style={btnStyle("#64748b")}>
          Clear
        </button>
      )}
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "0.5rem 0.75rem",
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  fontSize: 14,
};

function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    whiteSpace: "nowrap",
  };
}
