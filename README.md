# Piyush GameVerse

A full-stack React gaming discovery website built from the original IGDB/RAWG AJAX project. It now includes a professional gaming-style UI, game search and filters, user sign up/sign in, editable player profiles, favorites, XP, and levels.

## Features

- React + Vite frontend
- Express backend API
- RAWG games API integration
- Sign up and sign in with JWT authentication
- Password hashing with `bcryptjs`
- Editable user profile
- Favorite games collection
- Player XP and level system
- Responsive gaming dashboard UI
- Hindi-English comments in the code for easier understanding

## Tech Stack

- React
- Vite
- Express
- Node.js
- JWT
- bcryptjs
- RAWG API
- CSS

## Project Structure

```text
IGDB-AJAX-master/
├── extra/              # Images and existing assets
├── server/
│   └── index.js        # Express API, auth, profile, RAWG proxy
├── src/
│   ├── main.jsx        # React app
│   └── styles.css      # Gaming website styles
├── .env.example        # Example environment variables
├── index.html          # Vite HTML entry
├── package.json        # Scripts and dependencies
├── vite.config.js      # Vite proxy config for /api
└── README.md
```

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file from `.env.example`:

```bash
PORT=5000
JWT_SECRET=replace-with-a-long-random-secret
RAWG_API_KEY=your-rawg-api-key
```

You can get a RAWG API key from:

```text
https://rawg.io/apidocs
```

## Run The Project

Start both frontend and backend:

```bash
npm run dev
```

Open the website:

```text
http://localhost:5173
```

Backend API:

```text
http://localhost:5000
```

## GitHub Pages Deployment

This project now supports GitHub Pages static hosting.

GitHub Pages cannot run the Express backend, so the live Pages version uses:

- RAWG API directly from the browser
- Browser `localStorage` for demo sign up, sign in, profile, favorites, XP, and levels
- GitHub Actions to build and publish the `dist` folder

After pushing to GitHub:

1. Open your repository on GitHub.
2. Go to `Settings > Pages`.
3. Set source to `GitHub Actions`.
4. Wait for the deploy workflow to finish.

Live URL format:

```text
https://dotinpiyush.github.io/Piyush-GamingVerse/
```

## Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## API Routes

Health check:

```http
GET /api/health
```

Search games:

```http
GET /api/games?search=halo&page_size=12
```

Sign up:

```http
POST /api/auth/signup
```

Sign in:

```http
POST /api/auth/signin
```

Get profile:

```http
GET /api/profile
```

Update profile:

```http
PATCH /api/profile
```

Toggle favorite game:

```http
POST /api/profile/favorites
```

## Notes

- User data is saved locally in `server/data/users.json`.
- `server/data/` is ignored by Git because it is runtime data.
- In development, the frontend uses `/api` and Vite proxies requests to `http://localhost:5000`.
- On GitHub Pages, the frontend switches to static mode because `/api` cannot run there.
- For deployment, host the backend on Render, Railway, Vercel Serverless, or another Node host, then set `VITE_API_BASE_URL` to your deployed backend API URL.
- For a real production app, replace the JSON file storage with a database like MongoDB, PostgreSQL, or MySQL.

## Author

Made by **Piyush**.
