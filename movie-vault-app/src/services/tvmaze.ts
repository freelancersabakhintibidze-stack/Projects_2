import type { Movie, TvMazeSearchResult, TvMazeShow } from "../types/movie";

const BASE_URL = "https://api.tvmaze.com";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function mapShow(show: TvMazeShow): Movie {
  return {
    id: show.id,
    title: show.name,
    year: show.premiered ? show.premiered.split("-")[0] : "N/A",
    poster: show.image?.medium ?? "",
    rating: show.rating?.average ?? null,
    genres: show.genres ?? [],
    summary: stripHtml(show.summary ?? "No description available."),
    network: show.network?.name,
    status: show.status,
    language: show.language ?? undefined,
  };
}

export async function searchShows(query: string): Promise<Movie[]> {
  const url = `${BASE_URL}/search/shows?q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TVMaze error: ${res.status}`);
  const data: TvMazeSearchResult[] = await res.json();
  return data.map((item) => mapShow(item.show));
}

export async function getShowById(id: number): Promise<Movie> {
  const url = `${BASE_URL}/shows/${id}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TVMaze error: ${res.status}`);
  const show: TvMazeShow = await res.json();
  return mapShow(show);
}

export async function getPopularShows(): Promise<Movie[]> {
  const queries = ["batman", "game of thrones", "breaking bad", "the office", "friends"];
  const pick = queries[Math.floor(Math.random() * queries.length)];
  return searchShows(pick);
}
