# HAWK - Premium Anime Watchlist

A high-end, dark-themed anime tracking application built with React, Tailwind CSS, and Supabase.

## Features
- **Guest Mode**: Try the app instantly without an account.
- **Discover**: Real-time anime search and trending data via AniList & Jikan APIs.
- **Library**: Track your progress with a beautiful, antique gold & black UI.
- **Rich Details**: View trailers, relations, and similar anime recommendations.

## Local Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Note on Supabase
The project currently uses a pre-configured Supabase instance for previewing. To use your own database, update the credentials in `lib/supabase.ts`.