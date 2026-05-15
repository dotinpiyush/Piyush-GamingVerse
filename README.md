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
- For a real production app, replace the JSON file storage with a database like MongoDB, PostgreSQL, or MySQL.

## Author

Made by **Piyush**.
