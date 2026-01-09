
// Unified External Anime Interface
export interface ExternalAnime {
  id: number | string;
  idMal?: number;
  title: string;
  titleNative?: string;
  coverImage: string;
  bannerImage?: string;
  description?: string;
  episodes: number;
  status: string;
  format: string;
  season?: string;
  year?: number;
  score: number; // Normalized 0-100
  genres: string[];
  studios: string[];
  duration?: number;
  source: 'anilist' | 'jikan';
  relations?: ExternalAnimeRelation[];
  recommendations?: ExternalAnime[];
  trailerUrl?: string;
  isAdult?: boolean;
}

export interface ExternalAnimeRelation {
  id: number | string;
  title: string;
  coverImage: string;
  relationType: string; // SEQUEL, PREQUEL, etc.
  format: string;
}

// --- CACHING HELPERS ---
const CACHE_KEY = 'anime_cache';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

function getCached(key: string) {
  try {
    const item = localStorage.getItem(CACHE_KEY + '_' + key);
    if (!item) return null;
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function setCached(key: string, data: any) {
  try {
    localStorage.setItem(CACHE_KEY + '_' + key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {}
}

// --- JIKAN GENRE MAPPING ---
const JIKAN_GENRE_MAP: Record<string, number> = {
    'Action': 1,
    'Adventure': 2,
    'Comedy': 4,
    'Drama': 8,
    'Fantasy': 10,
    'Horror': 14,
    'Mystery': 7,
    'Romance': 22,
    'Sci-Fi': 24,
    'Slice of Life': 36,
    'Sports': 30,
    'Supernatural': 37,
    'Psychological': 40,
    'Mecha': 18,
    'Ecchi': 9,
    'Hentai': 12,
    'Harem': 35,
    'Erotica': 49,
    'Thriller': 41,
    'Seinen': 42,
    'Shoujo': 25,
    'Shounen': 27,
    'Josei': 43
};

// --- ANILIST GRAPHQL QUERIES ---

const ANILIST_ENDPOINT = 'https://graphql.anilist.co';

const QUERY_TOTAL_COUNT = `
query {
  Page(perPage: 1) {
    pageInfo {
      total
    }
    media(type: ANIME) {
      id
    }
  }
}
`;

const QUERY_SEARCH = `
query ($search: String, $genre: String, $page: Int, $perPage: Int, $sort: [MediaSort]) {
  Page (page: $page, perPage: $perPage) {
    media (search: $search, genre: $genre, type: ANIME, sort: $sort) {
      id
      idMal
      title { romaji english native }
      coverImage { large extraLarge }
      bannerImage
      description
      episodes
      meanScore
      format
      status
      season
      seasonYear
      genres
      duration
      studios(isMain: true) { nodes { name } }
      isAdult
    }
  }
}
`;

const QUERY_DETAILS_BY_ID = `
query ($id: Int) {
  Media (id: $id, type: ANIME) {
    id
    idMal
    title { romaji english native }
    coverImage { large extraLarge }
    bannerImage
    description
    episodes
    status
    format
    duration
    meanScore
    season
    seasonYear
    studios(isMain: true) { nodes { name } }
    genres
    trailer { site id }
    isAdult
    relations {
      edges {
        relationType(version: 2)
        node {
          id
          title { romaji }
          format
          status
          coverImage { medium }
        }
      }
    }
    recommendations(sort: RATING_DESC, perPage: 10) {
      nodes {
        mediaRecommendation {
          id
          title { romaji }
          coverImage { large }
          meanScore
        }
      }
    }
  }
}
`;

const QUERY_TRENDING = `
query ($page: Int, $perPage: Int) {
  Page (page: $page, perPage: $perPage) {
    media (type: ANIME, sort: TRENDING_DESC) {
      id
      idMal
      title { romaji english native }
      coverImage { large extraLarge }
      bannerImage
      description
      episodes
      meanScore
      format
      status
      season
      seasonYear
      genres
      duration
      studios(isMain: true) { nodes { name } }
      isAdult
    }
  }
}
`;

const QUERY_SEASONAL = `
query ($page: Int, $perPage: Int) {
  Page (page: $page, perPage: $perPage) {
    media (type: ANIME, sort: POPULARITY_DESC, status: RELEASING) {
      id
      idMal
      title { romaji english native }
      coverImage { large extraLarge }
      bannerImage
      description
      episodes
      meanScore
      format
      status
      season
      seasonYear
      genres
      duration
      studios(isMain: true) { nodes { name } }
      isAdult
    }
  }
}
`;

const QUERY_TOP = `
query ($page: Int, $perPage: Int) {
  Page (page: $page, perPage: $perPage) {
    media (type: ANIME, sort: SCORE_DESC) {
      id
      idMal
      title { romaji english native }
      coverImage { large extraLarge }
      bannerImage
      description
      episodes
      meanScore
      format
      status
      season
      seasonYear
      genres
      duration
      studios(isMain: true) { nodes { name } }
      isAdult
    }
  }
}
`;

// --- HELPERS ---

const fetchAniList = async (query: string, variables: any = {}) => {
  const response = await fetch(ANILIST_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  return response.json();
};

const mapAniListToExternal = (media: any): ExternalAnime => {
  return {
    id: media.id,
    idMal: media.idMal,
    title: media.title.english || media.title.romaji,
    titleNative: media.title.native,
    coverImage: media.coverImage.extraLarge || media.coverImage.large,
    bannerImage: media.bannerImage,
    description: media.description,
    episodes: media.episodes || 0,
    status: media.status,
    format: media.format,
    season: media.season,
    year: media.seasonYear,
    score: media.meanScore || 0,
    genres: media.genres || [],
    studios: media.studios?.nodes?.map((s: any) => s.name) || [],
    duration: media.duration,
    source: 'anilist',
    isAdult: media.isAdult,
    trailerUrl: media.trailer?.site === 'youtube' ? `https://www.youtube.com/embed/${media.trailer.id}` : undefined,
    relations: media.relations?.edges?.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title.romaji,
      coverImage: edge.node.coverImage.medium,
      relationType: edge.relationType,
      format: edge.node.format
    })).filter((r: any) => r.format === 'TV' || r.format === 'MOVIE' || r.format === 'ONA'),
    recommendations: media.recommendations?.nodes?.map((rec: any) => ({
      id: rec.mediaRecommendation?.id,
      title: rec.mediaRecommendation?.title.romaji,
      coverImage: rec.mediaRecommendation?.coverImage.large,
      score: rec.mediaRecommendation?.meanScore || 0,
      source: 'anilist'
    } as ExternalAnime)).filter((r: any) => r.id)
  };
};

const mapJikanToExternal = (item: any): ExternalAnime => {
    return {
        id: item.mal_id,
        idMal: item.mal_id,
        title: item.title,
        titleNative: item.title_japanese,
        coverImage: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
        description: item.synopsis,
        episodes: item.episodes || 0,
        status: item.status,
        format: item.type,
        season: item.season,
        year: item.year,
        score: item.score ? item.score * 10 : 0, 
        genres: item.genres?.map((g: any) => g.name) || [],
        studios: item.studios?.map((s: any) => s.name) || [],
        duration: item.duration ? parseInt(item.duration.replace(/\D/g, '')) || undefined : undefined,
        source: 'jikan',
        isAdult: item.rating?.toLowerCase().includes('rx') || item.rating?.toLowerCase().includes('hentai')
    };
};

// --- API METHODS ---

export const api = {
  
  async getTotalCount(force: boolean = false): Promise<number> {
    if (!force) {
      const cached = getCached('total_count');
      if (cached !== null) return cached;
    }

    try {
      const data = await fetchAniList(QUERY_TOTAL_COUNT);
      const total = data.data?.Page?.pageInfo?.total || 18000;
      setCached('total_count', total);
      return total;
    } catch (e) {
      console.warn("Failed to fetch total count", e);
      return 18000;
    }
  },

  // Added formatCount to support numeric formatting in App.tsx and other views
  formatCount(num: number): string {
    if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
    return num.toString();
  },

  async fetchJikanEpisodes(malId: number): Promise<number | null> {
    const cacheKey = `jikan_eps_${malId}`;
    const cached = getCached(cacheKey);
    if (cached !== null) return cached;

    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}`);
      if (!res.ok) return null;
      const json = await res.json();
      const eps = json.data?.episodes || null;
      setCached(cacheKey, eps);
      return eps;
    } catch (err) {
      console.warn("Jikan episode fetch failed", err);
      return null;
    }
  },

  async search(query: string, genre?: string, sort: 'title' | 'rating' | 'newest' = 'newest', page: number = 1): Promise<ExternalAnime[]> {
    const cacheKey = `search_${query}_${genre}_${sort}_${page}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    let targetGenre = genre;
    let targetQuery = query;

    if (query && (!genre || genre === 'All')) {
        const normalizedQuery = query.trim().toLowerCase();
        const matchedKey = Object.keys(JIKAN_GENRE_MAP).find(k => k.toLowerCase() === normalizedQuery);
        
        if (matchedKey) {
            targetGenre = matchedKey;
            targetQuery = '';
        }
    }

    try {
        const variables: any = { page: page, perPage: 25 };
        let anilistSort = ['SEARCH_MATCH'];
        if (sort === 'rating') anilistSort = ['SCORE_DESC'];
        else if (sort === 'newest') anilistSort = ['START_DATE_DESC'];
        else if (sort === 'title') anilistSort = (!targetQuery || targetQuery.trim() === '') ? ['TITLE_ROMAJI'] : ['SEARCH_MATCH'];
        
        variables.sort = anilistSort;
        if (targetQuery && targetQuery.trim() !== '') variables.search = targetQuery;
        if (targetGenre && targetGenre !== '') variables.genre = targetGenre;

        const data = await fetchAniList(QUERY_SEARCH, variables);
        if (data.data?.Page?.media && data.data.Page.media.length > 0) {
            const results = data.data.Page.media.map(mapAniListToExternal);
            setCached(cacheKey, results);
            return results;
        }
    } catch (e) {
         console.warn("AniList search failed, falling back to Jikan", e);
    }

    try {
        let url = `https://api.jikan.moe/v4/anime?limit=25&page=${page}`;
        if (sort === 'rating') url += '&order_by=score&sort=desc';
        else if (sort === 'newest') url += '&order_by=start_date&sort=desc';
        else if (sort === 'title') url += '&order_by=title&sort=asc';

        let genreId = targetGenre ? JIKAN_GENRE_MAP[targetGenre] : undefined;
        if (!genreId && targetGenre) {
             const key = Object.keys(JIKAN_GENRE_MAP).find(k => k.toLowerCase() === targetGenre!.toLowerCase());
             if (key) genreId = JIKAN_GENRE_MAP[key];
        }

        if (genreId) {
            url += `&genres=${genreId}`;
            if (targetQuery) url += `&q=${encodeURIComponent(targetQuery)}`;
        } else {
            let jikanQuery = targetQuery || '';
            if (targetGenre && !jikanQuery) jikanQuery = targetGenre;
            else if (targetGenre) jikanQuery += ` ${targetGenre}`;
            if (jikanQuery.toLowerCase().includes('hentai')) url += `&rating=rx`;
            url += `&q=${encodeURIComponent(jikanQuery)}`;
        }

        const res = await fetch(url);
        const json = await res.json();
        const results = json.data ? json.data.map(mapJikanToExternal) : [];
        setCached(cacheKey, results);
        return results;
    } catch (err) {
        return [];
    }
  },

  async getDetailsByTitle(title: string): Promise<ExternalAnime | null> {
    const cacheKey = `details_${title}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const searchData = await fetchAniList(QUERY_SEARCH, { search: title, page: 1, perPage: 1 });
      const media = searchData.data?.Page?.media?.[0];
      
      if (media) {
        const detailData = await fetchAniList(QUERY_DETAILS_BY_ID, { id: media.id });
        const external = mapAniListToExternal(detailData.data.Media);
        
        if ((!external.episodes || external.episodes === 0) && external.idMal) {
           const jikanEps = await this.fetchJikanEpisodes(external.idMal);
           if (jikanEps) external.episodes = jikanEps;
        }
        
        setCached(cacheKey, external);
        return external;
      }
      throw new Error("AniList entry not found");

    } catch (e) {
      try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`);
        const json = await res.json();
        if (json.data && json.data.length > 0) {
            const external = mapJikanToExternal(json.data[0]);
            setCached(cacheKey, external);
            return external;
        }
        return null;
      } catch (err) {
        return null;
      }
    }
  },

  async getTrending(page: number = 1, perPage: number = 20): Promise<ExternalAnime[]> {
    const cacheKey = `trending_${page}_${perPage}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchAniList(QUERY_TRENDING, { page, perPage });
      const results = data.data.Page.media.map(mapAniListToExternal);
      setCached(cacheKey, results);
      return results;
    } catch (e) {
      try {
        const res = await fetch(`https://api.jikan.moe/v4/top/anime?filter=airing&limit=${perPage}&page=${page}`);
        const json = await res.json();
        const results = json.data?.map(mapJikanToExternal) || [];
        setCached(cacheKey, results);
        return results;
      } catch (err) {
        return [];
      }
    }
  },

  async getSeasonal(page: number = 1, perPage: number = 20): Promise<ExternalAnime[]> {
    const cacheKey = `seasonal_${page}_${perPage}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchAniList(QUERY_SEASONAL, { page, perPage });
      const results = data.data.Page.media.map(mapAniListToExternal);
      setCached(cacheKey, results);
      return results;
    } catch (e) {
      try {
        const res = await fetch(`https://api.jikan.moe/v4/seasons/now?limit=${perPage}&page=${page}`);
        const json = await res.json();
        const results = json.data?.map(mapJikanToExternal) || [];
        setCached(cacheKey, results);
        return results;
      } catch (err) {
        return [];
      }
    }
  },

  async getTopRated(page: number = 1, perPage: number = 25): Promise<ExternalAnime[]> {
    const cacheKey = `toprated_${page}_${perPage}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchAniList(QUERY_TOP, { page, perPage });
      const results = data.data.Page.media.map(mapAniListToExternal);
      setCached(cacheKey, results);
      return results;
    } catch (e) {
      try {
        const res = await fetch(`https://api.jikan.moe/v4/top/anime?limit=${perPage}&page=${page}`);
        const json = await res.json();
        const results = json.data?.map(mapJikanToExternal) || [];
        setCached(cacheKey, results);
        return results;
      } catch (err) {
        return [];
      }
    }
  }
};
