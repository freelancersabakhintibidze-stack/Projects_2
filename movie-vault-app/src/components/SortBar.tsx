export type SortOption = "default" | "rating-desc" | "rating-asc" | "year-desc" | "year-asc" | "title-asc";

interface Props {
  value: SortOption;
  onChange: (v: SortOption) => void;
}

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: "default", label: "Relevance" },
  { value: "rating-desc", label: "Highest Rated" },
  { value: "rating-asc", label: "Lowest Rated" },
  { value: "year-desc", label: "Newest First" },
  { value: "year-asc", label: "Oldest First" },
  { value: "title-asc", label: "A → Z" },
];

export function SortBar({ value, onChange }: Props) {
  return (
    <div className="sort-bar">
      <label className="sort-label" htmlFor="sort-select">Sort:</label>
      <select
        id="sort-select"
        className="sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
