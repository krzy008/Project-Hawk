export enum AnimeStatus {
  Watching = "Watching",
  Finished = "Finished",
  PlanToWatch = "Plan to Watch",
  OnHold = "On-Hold",
  Dropped = "Dropped"
}

export interface Season {
  id: string;
  name: string;
  watched: number;
  total: number;
}

export interface Anime {
  id: string;
  title: string;
  status: AnimeStatus;
  watched: number;
  total: number;
  rating: number; // 1-10
  season: string;
  notes: string;
  coverUrl: string;
  seasons?: Season[];
  genres: string[];
  duration?: number; // Duration in minutes
  createdAt?: string;
}

export type TabType = 'watching' | 'finished' | 'ptw';

export type ViewState = 'list' | 'add' | 'edit' | 'detail' | 'discover' | 'profile' | 'mal_import' | 'leaderboard' | 'friends' | 'faq' | 'about';