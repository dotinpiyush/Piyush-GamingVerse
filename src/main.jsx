import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BadgeCheck,
  Gamepad2,
  Heart,
  LogIn,
  LogOut,
  Search,
  Shield,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
  Zap
} from 'lucide-react';
import './styles.css';

// Yaha frontend ka API base set hai; Vite proxy is /api ko backend tak bhejta hai.
const API_BASE = '/api';

// Yaha website me dikhne wale genre names rakhe gaye hain.
const genres = ['Action', 'Adventure', 'RPG', 'Shooter', 'Indie', 'Racing'];

// RAWG API ko genre ka slug chahiye hota hai, isliye simple naam ko slug me convert karte hain.
const genreSlugs = {
  Action: 'action',
  Adventure: 'adventure',
  RPG: 'role-playing-games-rpg',
  Shooter: 'shooter',
  Indie: 'indie',
  Racing: 'racing'
};

function App() {
  // Token localStorage se uthate hain taki page refresh ke baad bhi login active rahe.
  const [token, setToken] = useState(() => localStorage.getItem('gameverse_token') || '');

  // Yaha logged-in user ka profile data store hota hai.
  const [user, setUser] = useState(null);

  // Ye decide karta hai ki form sign in mode me hai ya sign up mode me.
  const [authMode, setAuthMode] = useState('signin');

  // Auth form ke saare input values yaha store hote hain.
  const [authForm, setAuthForm] = useState({
    name: 'Piyush',
    email: '',
    password: '',
    favoriteGenre: 'Action'
  });

  // Profile edit form ke values yaha rakhe jaate hain.
  const [profileForm, setProfileForm] = useState({ name: '', bio: '', favoriteGenre: 'Action' });

  // Search input ka current text yaha store hota hai.
  const [query, setQuery] = useState('cyberpunk');

  // Selected genre ka value yaha store hota hai.
  const [selectedGenre, setSelectedGenre] = useState('Action');

  // Selected sorting option yaha store hota hai.
  const [ordering, setOrdering] = useState('-rating');

  // API se aaye hue games ki list yaha save hoti hai.
  const [games, setGames] = useState([]);

  // Loading true hone par skeleton cards dikhte hain.
  const [loading, setLoading] = useState(true);

  // User ko success ya error message dikhane ke liye ye state hai.
  const [message, setMessage] = useState('');

  // Set se quickly check hota hai ki koi game favorite list me hai ya nahi.
  const favoriteIds = useMemo(() => new Set(user?.favorites?.map((game) => game.id) || []), [user]);

  useEffect(() => {
    // Page load hote hi default games fetch karte hain.
    fetchGames('cyberpunk', selectedGenre, ordering);
  }, []);

  useEffect(() => {
    // Agar token nahi hai to profile fetch karne ki zaroorat nahi.
    if (!token) return;

    // Token milne par backend se latest profile data mangaate hain.
    request('/profile', { token })
      .then(({ user: profile }) => {
        // Backend se aaya profile frontend state me save karte hain.
        setUser(profile);

        // Profile edit form ko current profile values se fill karte hain.
        setProfileForm({
          name: profile.name,
          bio: profile.bio,
          favoriteGenre: profile.favoriteGenre
        });
      })
      // Token invalid ho to user ko logout kar dete hain.
      .catch(() => logout());
  }, [token]);

  async function request(path, options = {}) {
    // Backend ke saare API calls ke liye ye common helper function hai.
    const response = await fetch(`${API_BASE}${path}`, {
      // Agar method nahi diya to GET default rahega.
      method: options.method || 'GET',

      // JSON data bhejne aur token attach karne ke liye headers set karte hain.
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
      },

      // Body sirf tab bhejte hain jab request me data ho.
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    // Response ko JSON me convert karte hain.
    const data = await response.json();

    // Agar backend error de to uska message throw karte hain.
    if (!response.ok) throw new Error(data.message || 'Something went wrong.');

    // Successful response data return karte hain.
    return data;
  }

  async function fetchGames(search = query, genre = selectedGenre, sort = ordering) {
    // Request start hone par loading on karte hain.
    setLoading(true);

    // Purana message clear kar dete hain.
    setMessage('');
    try {
      // Search, genre aur sorting values ko URL params me convert karte hain.
      const params = new URLSearchParams({
        search,
        ordering: sort,
        genres: genreSlugs[genre] || '',
        page_size: '12'
      });

      // Frontend /api/games call karta hai; Vite proxy isse backend tak bhejta hai.
      const response = await fetch(`${API_BASE}/games?${params}`);

      // Games API ka response JSON me read karte hain.
      const data = await response.json();

      // Results array ko games state me save karte hain.
      setGames(data.results || []);
    } catch {
      // Error aane par user friendly message dikhate hain.
      setMessage('Games load nahi ho paaye. API server check karein.');
    } finally {
      // Request complete hone ke baad loading off karte hain.
      setLoading(false);
    }
  }

  async function handleAuth(event) {
    // Form submit se page refresh na ho isliye preventDefault use karte hain.
    event.preventDefault();

    // Purana message clear karte hain.
    setMessage('');
    try {
      // authMode ke hisaab se sign in ya sign up endpoint choose hota hai.
      const endpoint = authMode === 'signin' ? '/auth/signin' : '/auth/signup';

      // Backend ko auth form ka data bhejte hain.
      const data = await request(endpoint, { method: 'POST', body: authForm });

      // Login token browser me save karte hain.
      localStorage.setItem('gameverse_token', data.token);

      // Token ko React state me set karte hain.
      setToken(data.token);

      // User profile ko React state me save karte hain.
      setUser(data.user);

      // Profile form ko user data se fill karte hain.
      setProfileForm({
        name: data.user.name,
        bio: data.user.bio,
        favoriteGenre: data.user.favoriteGenre
      });

      // User ko success message dikhate hain.
      setMessage(authMode === 'signin' ? 'Welcome back, gamer.' : 'Account ready. Profile unlocked.');
    } catch (error) {
      // Backend se aaya error message user ko dikhate hain.
      setMessage(error.message);
    }
  }

  async function updateProfile(event) {
    // Profile form submit par page refresh rok dete hain.
    event.preventDefault();
    try {
      // Profile update backend me save hota hai aur updated user wapas milta hai.
      const data = await request('/profile', { method: 'PATCH', token, body: profileForm });

      // Updated user ko frontend state me save karte hain.
      setUser(data.user);

      // Success message show karte hain.
      setMessage('Profile updated successfully.');
    } catch (error) {
      // Error message show karte hain.
      setMessage(error.message);
    }
  }

  async function toggleFavorite(game) {
    // Favorites user profile se linked hote hain, isliye login zaroori hai.
    if (!token) {
      // Agar user logged in nahi hai to message dikhate hain.
      setMessage('Favorites ke liye pehle sign in karein.');
      return;
    }
    try {
      // Backend ko selected game bhejte hain, backend add ya remove decide karta hai.
      const data = await request('/profile/favorites', { method: 'POST', token, body: { game } });

      // Updated user profile state me save hota hai.
      setUser(data.user);
    } catch (error) {
      // Error aane par message show hota hai.
      setMessage(error.message);
    }
  }

  function logout() {
    // Browser storage se token remove karte hain.
    localStorage.removeItem('gameverse_token');

    // Token state empty karte hain.
    setToken('');

    // User state clear karte hain.
    setUser(null);

    // Logout message show karte hain.
    setMessage('Signed out.');
  }

  function searchGames(event) {
    // Search form submit par page refresh rok dete hain.
    event.preventDefault();

    // Current search/filter values se games reload karte hain.
    fetchGames(query, selectedGenre, ordering);
  }

  return (
    <div className="app-shell">
      {/* Ye top navigation section hai jaha brand aur login status dikhte hain. */}
      <nav className="nav">
        <div className="brand">
          <Gamepad2 size={30} />
          <div>
            <span>Piyush GameVerse</span>
            <small>React gaming discovery hub</small>
          </div>
        </div>
        <div className="nav-actions">
          <span className="status-pill">
            <Shield size={16} /> RAWG powered
          </span>
          {user ? (
            <button className="ghost-btn" onClick={logout}>
              <LogOut size={18} /> Sign out
            </button>
          ) : (
            <span className="status-pill">
              <LogIn size={16} /> Guest mode
            </span>
          )}
        </div>
      </nav>

      {/* Ye hero section hai jaha main title, search bar aur player card dikhte hain. */}
      <header className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={16} /> Built by Piyush
          </span>
          <h1>Discover games, save favorites, and level up your profile.</h1>
          <p>
            A full-stack React gaming website with search, filters, sign in, sign up,
            profile editing, favorites, XP, and a clean esports-style dashboard.
          </p>
          <form className="search-panel" onSubmit={searchGames}>
            <label>
              <Search size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search games..."
              />
            </label>
            <select value={selectedGenre} onChange={(event) => setSelectedGenre(event.target.value)}>
              {genres.map((genre) => (
                <option key={genre}>{genre}</option>
              ))}
            </select>
            <select value={ordering} onChange={(event) => setOrdering(event.target.value)}>
              <option value="-rating">Top rated</option>
              <option value="-released">Newest</option>
              <option value="-metacritic">Critic score</option>
              <option value="name">A to Z</option>
            </select>
            <button type="submit">
              <Zap size={18} /> Search
            </button>
          </form>
        </div>
        {/* Ye side card user ka level ya signup prompt dikhata hai. */}
        <aside className="hero-card">
          <Trophy size={34} />
          <strong>{user ? `Level ${user.level} Player` : 'Create your player card'}</strong>
          <span>{user ? `${user.xp} XP earned` : 'Sign up to save favorites and profile stats.'}</span>
        </aside>
      </header>

      {/* Message available ho to toast dikhate hain. */}
      {message && <div className="toast">{message}</div>}

      <main className="main-grid">
        {/* Ye main game library section hai. */}
        <section className="game-zone">
          <div className="section-heading">
            <div>
              <span>Game Library</span>
              <h2>Playable Picks</h2>
            </div>
            <p>{loading ? 'Loading arena...' : `${games.length} games found`}</p>
          </div>
          <div className="game-grid">
            {/* Loading true ho to skeleton cards dikhte hain, warna real games dikhte hain. */}
            {loading
              ? Array.from({ length: 6 }).map((_, index) => <div className="skeleton" key={index} />)
              : games.map((game) => (
                  <article className="game-card" key={game.id}>
                    <img src={game.background_image || './extra/pexels-lulizler-3165335.jpg'} alt={game.name} />
                    <div className="game-content">
                      <div>
                        <h3>{game.name}</h3>
                        <p>{game.released || 'Release TBA'}</p>
                      </div>
                      <div className="meta-row">
                        <span>
                          <Star size={16} /> {game.rating || 'N/A'}
                        </span>
                        <button
                          className={favoriteIds.has(game.id) ? 'liked icon-btn' : 'icon-btn'}
                          // Button click par game favorite add ya remove hota hai.
                          onClick={() => toggleFavorite(game)}
                          title="Toggle favorite"
                        >
                          <Heart size={18} fill={favoriteIds.has(game.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
          </div>
        </section>

        {/* Side stack me auth, profile aur favorite panels hain. */}
        <aside className="side-stack">
          <section className="panel auth-panel">
            {/* Ye tabs sign in aur sign up mode switch karte hain. */}
            <div className="tabs">
              <button className={authMode === 'signin' ? 'active' : ''} onClick={() => setAuthMode('signin')}>
                <LogIn size={16} /> Sign in
              </button>
              <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>
                <UserPlus size={16} /> Sign up
              </button>
            </div>
            <form onSubmit={handleAuth}>
              {/* Signup mode me name input dikhaya jata hai. */}
              {authMode === 'signup' && (
                <input
                  value={authForm.name}
                  onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
                  placeholder="Your name"
                />
              )}
              {/* Email input sign in aur sign up dono me common hai. */}
              <input
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                placeholder="Email"
                required
              />
              {/* Password input sign in aur sign up dono me common hai. */}
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                placeholder="Password"
                required
              />
              {/* Signup mode me favorite genre choose karne ka option dikhate hain. */}
              {authMode === 'signup' && (
                <select
                  value={authForm.favoriteGenre}
                  onChange={(event) => setAuthForm({ ...authForm, favoriteGenre: event.target.value })}
                >
                  {genres.map((genre) => (
                    <option key={genre}>{genre}</option>
                  ))}
                </select>
              )}
              <button type="submit">{authMode === 'signin' ? 'Enter Arena' : 'Create Player'}</button>
            </form>
          </section>

          {/* Ye profile panel logged-in user ko profile edit karne deta hai. */}
          <section className="panel profile-panel">
            <div className="section-heading compact">
              <div>
                <span>Player Profile</span>
                <h2>{user?.name || 'Guest Player'}</h2>
              </div>
              <BadgeCheck size={24} />
            </div>
            {user ? (
              // User logged in ho to editable profile form dikhate hain.
              <form onSubmit={updateProfile}>
                <input
                  value={profileForm.name}
                  onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                />
                <textarea
                  value={profileForm.bio}
                  onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })}
                  rows="3"
                />
                <select
                  value={profileForm.favoriteGenre}
                  onChange={(event) => setProfileForm({ ...profileForm, favoriteGenre: event.target.value })}
                >
                  {genres.map((genre) => (
                    <option key={genre}>{genre}</option>
                  ))}
                </select>
                <button type="submit">Save Profile</button>
              </form>
            ) : (
              // User logged in nahi hai to simple message dikhate hain.
              <p className="muted">Sign in to unlock editable profile, favorites, XP, and player level.</p>
            )}
          </section>

          {/* Ye favorites panel user ke saved games dikhata hai. */}
          <section className="panel">
            <div className="section-heading compact">
              <div>
                <span>Favorites</span>
                <h2>Saved Games</h2>
              </div>
              <Heart size={22} />
            </div>
            <div className="favorite-list">
              {/* Favorites available hain to list dikhate hain, warna empty message. */}
              {(user?.favorites || []).length ? (
                user.favorites.map((game) => (
                  <div className="favorite-item" key={game.id}>
                    <img src={game.image || './extra/pexels-lulizler-3165335.jpg'} alt={game.name} />
                    <div>
                      <strong>{game.name}</strong>
                      <small>{game.released}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">Heart games from the library to build your collection.</p>
              )}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
