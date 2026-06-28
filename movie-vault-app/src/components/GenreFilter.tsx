interface Props {
  genres: string[];
  selected: string;
  onSelect: (genre: string) => void;
}

export function GenreFilter({ genres, selected, onSelect }: Props) {
  if (genres.length === 0) return null;

  return (
    <div className="genre-filter" role="group" aria-label="Filter by genre">
      <button
        className={`genre-chip ${selected === "" ? "active" : ""}`}
        onClick={() => onSelect("")}
      >
        All
      </button>
      {genres.map((g) => (
        <button
          key={g}
          className={`genre-chip ${selected === g ? "active" : ""}`}
          onClick={() => onSelect(g)}
        >
          {g}
        </button>
      ))}
    </div>
  );
}
