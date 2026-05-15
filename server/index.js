import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ES module me __filename direct nahi milta, isliye fileURLToPath se banate hain.
const __filename = fileURLToPath(import.meta.url);

// Current server folder ka path nikalte hain.
const __dirname = path.dirname(__filename);

// Express app create karte hain.
const app = express();

// Port env se aayega, nahi to 5000 use hoga.
const PORT = process.env.PORT || 5000;

// JWT secret env se aayega; production me strong secret use karna chahiye.
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-for-production';

// RAWG API key env se aayegi; fallback me old demo key use ho rahi hai.
const RAWG_KEY = process.env.RAWG_API_KEY || '1bce2fc627e74027bc3143fbe3e0b435';

// Local JSON database folder ka path.
const dataDir = path.join(__dirname, 'data');

// Users JSON file ka full path.
const dbPath = path.join(dataDir, 'users.json');

// Development me Vite frontend ko Express API se connect karne ke liye CORS enable hai.
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));

// JSON body read karne ke liye middleware lagate hain.
app.use(express.json({ limit: '1mb' }));

async function readUsers() {
  // Users ko read karne ke liye JSON file local database ki tarah use hoti hai.
  try {
    // users.json file ka text read karte hain.
    const file = await readFile(dbPath, 'utf8');

    // JSON text ko JavaScript array me convert karte hain.
    return JSON.parse(file);
  } catch {
    // Agar file/folder nahi hai to data folder create karte hain.
    await mkdir(dataDir, { recursive: true });

    // Empty users file create karte hain.
    await writeFile(dbPath, '[]');

    // Pehli baar empty users array return karte hain.
    return [];
  }
}

async function writeUsers(users) {
  // Signup, profile update ya favorite change par pura users array file me save hota hai.
  await mkdir(dataDir, { recursive: true });

  // Users array ko readable JSON format me file me write karte hain.
  await writeFile(dbPath, JSON.stringify(users, null, 2));
}

function createToken(user) {
  // JWT me sirf safe user identity save hoti hai, password kabhi nahi.
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  // Frontend ko data bhejne se pehle passwordHash hata dete hain.
  const { passwordHash, ...safeUser } = user;

  // Safe user object return karte hain.
  return safeUser;
}

function authGuard(req, res, next) {
  // Protected routes ke liye "Authorization: Bearer <token>" header chahiye.
  const token = req.headers.authorization?.replace('Bearer ', '');

  // Token missing ho to unauthorized response bhejte hain.
  if (!token) return res.status(401).json({ message: 'Please sign in first.' });

  try {
    // Token verify karke user payload request me attach karte hain.
    req.user = jwt.verify(token, JWT_SECRET);

    // Token valid hai to next route handler run hota hai.
    next();
  } catch {
    // Token invalid ya expired ho to error bhejte hain.
    res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }
}

app.post('/api/auth/signup', async (req, res) => {
  // Basic validation ke baad naya player account create hota hai.
  const { name, email, password, favoriteGenre = 'Action' } = req.body;

  // Required fields missing ho to bad request bhejte hain.
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  // Weak password allow nahi karte.
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  // Existing users JSON file se read karte hain.
  const users = await readUsers();

  // Email duplicate hai ya nahi check karte hain.
  const exists = users.some((user) => user.email.toLowerCase() === email.toLowerCase());

  // Duplicate email par conflict response bhejte hain.
  if (exists) return res.status(409).json({ message: 'This email already has an account.' });

  // Naya user object create karte hain.
  const user = {
    // Har user ko unique id dete hain.
    id: randomUUID(),

    // Name trim karke extra spaces hata dete hain.
    name: name.trim(),

    // Email lowercase me save karte hain taki comparison easy ho.
    email: email.trim().toLowerCase(),

    // User ka favorite genre save hota hai.
    favoriteGenre,

    // Default profile bio set karte hain.
    bio: 'Ready to discover the next favorite game.',

    // New player level 1 se start hota hai.
    level: 1,

    // Starting XP thoda sa dete hain.
    xp: 120,

    // Favorites list initially empty hoti hai.
    favorites: [],

    // Account create hone ka time save karte hain.
    createdAt: new Date().toISOString(),

    // Sirf hashed password save hota hai, plain password nahi.
    passwordHash: await bcrypt.hash(password, 10)
  };

  // New user ko users array me add karte hain.
  users.push(user);

  // Updated users array file me save karte hain.
  await writeUsers(users);

  // Token aur safe user frontend ko bhejte hain.
  res.status(201).json({ token: createToken(user), user: publicUser(user) });
});

app.post('/api/auth/signin', async (req, res) => {
  // Email match karke entered password ko stored hash se compare karte hain.
  const { email, password } = req.body;

  // Users list read karte hain.
  const users = await readUsers();

  // Entered email ke basis par user find karte hain.
  const user = users.find((item) => item.email === String(email).toLowerCase());

  // User missing ya password galat ho to invalid login response.
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  // Login successful ho to token aur safe user return karte hain.
  res.json({ token: createToken(user), user: publicUser(user) });
});

app.get('/api/profile', authGuard, async (req, res) => {
  // Currently logged-in user ki profile return hoti hai.
  const users = await readUsers();

  // Token ke id se user find karte hain.
  const user = users.find((item) => item.id === req.user.id);

  // User file me na mile to 404 response bhejte hain.
  if (!user) return res.status(404).json({ message: 'Profile not found.' });

  // Safe profile frontend ko bhejte hain.
  res.json({ user: publicUser(user) });
});

app.patch('/api/profile', authGuard, async (req, res) => {
  // Sirf selected safe profile fields ko edit karne ki permission hai.
  const users = await readUsers();

  // Logged-in user ka index find karte hain.
  const index = users.findIndex((item) => item.id === req.user.id);

  // User nahi mila to 404 bhejte hain.
  if (index === -1) return res.status(404).json({ message: 'Profile not found.' });

  // Inhi fields ko update karne ki permission hai.
  const allowed = ['name', 'bio', 'favoriteGenre'];

  // Har allowed field check karke update karte hain.
  allowed.forEach((key) => {
    // Sirf string values update karte hain taki unsafe data save na ho.
    if (typeof req.body[key] === 'string') users[index][key] = req.body[key].trim();
  });

  // Updated users ko file me save karte hain.
  await writeUsers(users);

  // Updated safe user frontend ko return karte hain.
  res.json({ user: publicUser(users[index]) });
});

app.post('/api/profile/favorites', authGuard, async (req, res) => {
  // Ye route game ko favorites me add/remove karta hai aur XP update karta hai.
  const { game } = req.body;

  // Game data missing ho to bad request bhejte hain.
  if (!game?.id || !game?.name) return res.status(400).json({ message: 'Game data is required.' });

  // Users list read karte hain.
  const users = await readUsers();

  // Logged-in user ka index find karte hain.
  const index = users.findIndex((item) => item.id === req.user.id);

  // User nahi mila to 404 bhejte hain.
  if (index === -1) return res.status(404).json({ message: 'Profile not found.' });

  // Favorite me sirf needed game fields save karte hain.
  const favorite = {
    id: game.id,
    name: game.name,
    rating: game.rating || 0,
    image: game.background_image || '',
    released: game.released || 'Unknown'
  };

  // Check karte hain ki game already favorites me hai ya nahi.
  const exists = users[index].favorites.some((item) => item.id === favorite.id);

  // Agar favorite already hai to remove, warna list ke top par add.
  users[index].favorites = exists
    ? users[index].favorites.filter((item) => item.id !== favorite.id)
    : [favorite, ...users[index].favorites].slice(0, 12);

  // Favorite add par XP badhta hai, remove par thoda kam hota hai.
  users[index].xp += exists ? -10 : 10;

  // XP ke basis par level calculate karte hain.
  users[index].level = Math.max(1, Math.floor(users[index].xp / 100));

  // Updated users file me save karte hain.
  await writeUsers(users);

  // Updated profile frontend ko return karte hain.
  res.json({ user: publicUser(users[index]) });
});

app.get('/api/games', async (req, res) => {
  // Frontend is route ko call karta hai, backend RAWG API se data laata hai.
  const search = req.query.search || 'popular';

  // Sorting query nahi mile to top rating sorting use hoti hai.
  const ordering = req.query.ordering || '-rating';

  // Genre optional hota hai.
  const genres = req.query.genres || '';

  // Page size optional hota hai.
  const pageSize = req.query.page_size || '12';

  // RAWG API ke liye query params banate hain.
  const params = new URLSearchParams({
    key: RAWG_KEY,
    search,
    ordering,
    page_size: pageSize
  });

  // Genre diya ho to params me add karte hain.
  if (genres) params.set('genres', genres);

  try {
    // RAWG API ko request bhejte hain.
    const response = await fetch(`https://api.rawg.io/api/games?${params}`);

    // RAWG se error aaye to catch block me bhejte hain.
    if (!response.ok) throw new Error('Game API request failed');

    // RAWG response JSON me convert karte hain.
    const data = await response.json();

    // RAWG ka data frontend ko send karte hain.
    res.json(data);
  } catch {
    // Network ya API error par clean message bhejte hain.
    res.status(502).json({ message: 'Unable to load games right now.' });
  }
});

app.get('/api/health', (_req, res) => {
  // Health route se check hota hai ki backend running hai.
  res.json({ ok: true, service: 'Piyush GameVerse API' });
});

app.listen(PORT, () => {
  // Server start hone par terminal me URL print hota hai.
  console.log(`API running on http://localhost:${PORT}`);
});
