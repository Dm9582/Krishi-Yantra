# 🚜 Krishi Yantra — Peer-to-Peer Farm Equipment Sharing Platform

> **Empowering Indian farmers to rent, list, and share agricultural machinery — affordable, verified, and nearby.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://krishi-yantra.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Dm9582%2FKrishi--Yantra-blue?style=for-the-badge&logo=github)](https://github.com/Dm9582/Krishi-Yantra)
[![Node](https://img.shields.io/badge/Node-20.x-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**Live Deployment:** `https://krishi-yantra.vercel.app` (Vercel) — if your deployment URL differs, update this badge link to your actual `https://<project>.vercel.app` from Vercel Dashboard → copy URL.

**GitHub:** https://github.com/Dm9582/Krishi-Yantra

---

## 📸 Preview

| Home (Hero + Categories) | Equipment Listing (Filters) | Booking Calendar (🟢 Available 🔴 Booked 🔵 Selected) |
|---|---|---|
| ![Home](https://via.placeholder.com/400x220?text=Home+Hero) | ![Equipment](https://via.placeholder.com/400x220?text=Equipment+Cards) | ![Calendar](https://via.placeholder.com/400x220?text=Calendar) |

> Mobile-first, large buttons, high-contrast, icon-heavy — designed for rural farmers with limited digital literacy.

---

## ✨ Features

- **List & Earn:** Farmers list idle tractors/harvesters for rent and earn
- **Search Nearby:** Search by name, filter by category/location/price/availability, sort by price/rating
- **Smart Calendar:** Interactive month nav, disables booked dates, prevents invalid ranges, visual legend (🟢 Available, 🔴 Booked, 🔵 Selected)
- **Double-Booking Prevention:** Critical overlap check on **both** frontend and backend (`date(newStart) <= date(existingEnd) AND date(newEnd) >= date(existingStart)`)
- **Weather + Recommendations:** Mock deterministic weather per location/date + equipment-specific advice (e.g., harvester: rain <20% → “Good day for harvesting”)
- **Hindi/English Toggle:** One-click `English | हिंदी`, clean `translations.js` dictionary, extensible for more languages
- **Auth:** Secure register/login (bcryptjs hash, JWT 7d, validation, 409 on duplicate)
- **Dashboard:** `Namaste, Farmer 👋` + stats (My Equipment, Active Bookings, Earnings), weather, recent bookings
- **Booking Management:** My Bookings with status badges (Pending/Confirmed/Completed/Cancelled), owner/renter views, cancel/complete
- **Responsive:** Works on mobile, tablet, laptop, desktop (tested 320px → 1440px)

**Example Pricing:**
> 🚜 Tractor — ₹2,500 / day — Available in Sehore, Madhya Pradesh

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3 (mobile-first, custom), Vanilla JavaScript (no framework) |
| **Backend** | Node.js 20.x, Express 4.18, CORS, dotenv, multer |
| **Database** | SQLite (`sqlite3` 5.1.7, file `database/krishi.db` → `/tmp/krishi.db` on Vercel) |
| **Auth** | `bcryptjs` + `jsonwebtoken` |
| **Weather** | Mock service (`backend/services/weatherService.js`) — deterministic, no external key |
| **Icons** | Font Awesome 6.5 |
| **Deploy** | Vercel (`@vercel/node` serverless, `vercel.json` rewrites) + GitHub |

---

## 📁 Project Structure

```
krishi-yantra/
├── api/
│   └── index.js                 # Vercel serverless entry (exports Express app)
├── frontend/
│   ├── index.html               # Home — hero, categories, popular, weather, how-it-works, CTA
│   ├── equipment.html           # Listing — search + filters + sort + cards
│   ├── equipment-details.html   # Details — photos, specs, owner, calendar, recommendation
│   ├── booking.html             # Booking — equipment summary, calendar, weather rec, confirm
│   ├── dashboard.html           # Dashboard — greeting, stats, weather, recent, my equipment
│   ├── login.html               # Auth — email/phone + password
│   ├── register.html            # Auth — name, phone, email, password, location, lang
│   ├── list-equipment.html      # List — name, category, desc, price, location, image
│   ├── my-bookings.html         # Bookings — renter/owner filters, status badges
│   ├── weather.html             # Weather — location/type/date → forecast + rec
│   ├── profile.html             # Profile — view/edit, my equipment, bookings
│   ├── css/
│   │   └── style.css            # Mobile-first, large buttons, card grid, responsive
│   └── js/
│       ├── main.js              # Nav, lang toggle, JWT helpers, apiFetch
│       ├── translations.js      # en/hi dictionary, t(), setLanguage(), addLanguage()
│       ├── equipment.js         # fetchEquipment(), render cards, filters
│       ├── auth.js              # login/register handlers
│       ├── weather.js           # fetchWeather(), recommendation UI
│       ├── calendar.js          # Month nav, booked/available/selected, validation
│       └── booking.js           # Duration, total = days×price, confirm
├── backend/
│   ├── server.js                # Express app + static + API mounts, conditional listen for Vercel
│   ├── routes/
│   │   ├── auth.js              # POST register/login, GET/PUT profile
│   │   ├── equipment.js         # GET (filters), GET :id, POST/PUT/DELETE, GET availability
│   │   ├── bookings.js          # POST (double-booking), GET, PUT status, DELETE
│   │   ├── weather.js           # GET, GET /recommendation, GET /forecast
│   │   └── reviews.js           # GET/:id, POST
│   ├── middleware/
│   │   └── auth.js              # JWT verify, optionalAuth
│   ├── services/
│   │   └── weatherService.js    # getMockWeather(), getRecommendation()
│   └── config/
│       └── database.js          # SQLite init, schema exec, seed, /tmp on Vercel
├── database/
│   ├── schema.sql               # users, equipment, bookings, reviews + indexes
│   └── krishi.db                # (gitignored, auto-created)
├── vercel.json                  # { "rewrites": [{ "source": "/(.*)", "destination": "/api" }] }
├── package.json                 # engines: node 20.x, scripts: start/dev/init-db
├── .env.example
└── README.md
```

---

## 🗄️ Database Design

**`users`**
```sql
id PK, name, phone UNIQUE, email UNIQUE, password_hash, location, preferred_language ('en','hi'), created_at
```

**`equipment`**
```sql
id PK, owner_id FK→users, name, type ('tractor','harvester','cultivator','seeder','irrigation','other'),
description, location, price_per_day (>0), image_url, availability_status ('available','rented','maintenance'),
rating (0-5), created_at
Indexes: type, location, owner_id
```

**`bookings`**
```sql
id PK, equipment_id FK→equipment, renter_id FK→users, start_date (TEXT ISO), end_date, total_price, status
('pending','confirmed','completed','cancelled'), created_at
CHECK(date(end_date) >= date(start_date))
Indexes: equipment_id, (equipment_id, start_date, end_date), renter_id
```

**`reviews`**
```sql
id PK, equipment_id FK, user_id FK, rating 1-5, comment, created_at
```

Seeded: 11 equipment (3 tractors, 2 harvesters, 2 cultivators, 2 seeders, 2 irrigation) + 3 users + 2 bookings (Tractor #1 booked 2026-08-10→15 for testing).

---

## 🔌 API Reference

Base: `http://localhost:3000` or `https://<your>.vercel.app`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Register (name, phone, email, password, location, lang) → 201 + JWT |
| `POST` | `/api/auth/login` | — | Login (email/phone + password) → JWT |
| `GET` | `/api/auth/profile` | ✅ | Get profile |
| `PUT` | `/api/auth/profile` | ✅ | Update name/location/lang |
| `GET` | `/api/equipment?search=&type=&location=&minPrice=&maxPrice=&availability=&sort=&owner_id=` | — | List with filters/sort |
| `GET` | `/api/equipment/:id` | — | Details + bookings + reviews |
| `GET` | `/api/equipment/:id/availability?start=&end=` | — | Check overlap |
| `POST` | `/api/equipment` | ✅ | Create (owner = JWT) |
| `PUT` | `/api/equipment/:id` | ✅ (owner) | Update |
| `DELETE` | `/api/equipment/:id` | ✅ (owner) | Delete (blocked if active bookings) |
| `POST` | `/api/bookings` | ✅ | Create (double-booking SQL check) → 409 if overlap |
| `GET` | `/api/bookings?type=owner\|renter\|all` | ✅ | List (renter/owner/all) |
| `GET` | `/api/bookings/:id` | ✅ (owner/renter) | Details |
| `PUT` | `/api/bookings/:id` | ✅ | Update status |
| `DELETE` | `/api/bookings/:id` | ✅ | Cancel (sets cancelled) |
| `GET` | `/api/weather?location=` | — | Mock weather + 5-day forecast |
| `GET` | `/api/weather/recommendation?equipmentType=&date=&location=` | — | Weather + advice per type |
| `GET` | `/api/recommendations?...` | — | Alias to weather/recommendation |
| `GET` | `/api/reviews/:equipmentId` | — | List reviews |
| `POST` | `/api/reviews` | ✅ | Add review |
| `GET` | `/api/health` | — | `{status:"ok"}` |

**Status codes:** `200/201` success, `400` validation, `401` no token, `403` forbidden, `404` not found, `409` duplicate/overlap.

---

## 🚀 Quick Start (Local)

```bash
git clone https://github.com/Dm9582/Krishi-Yantra.git
cd Krishi-Yantra  # or krishi-yantra folder
npm install
npm start
# Open http://localhost:3000
# Health: http://localhost:3000/api/health
```

**Env (`.env` — defaults work):**
```
PORT=3000
JWT_SECRET=krishi_yantra_secret_2024_secure_key
WEATHER_API_KEY=mock_key
NODE_ENV=development
```

**Demo Accounts (password `password123`):**
- `ramesh@example.com` / `9876543210` — Sehore, MP (hi)
- `priya@example.com` / `9876543211` — Ludhiana, Punjab
- `arjun@example.com` / `9876543212` — Nashik, MH
- Or register a new farmer at `/register.html`

---

## 🌦️ Weather Recommendations

| Equipment | Rain <20% | 20-40% | >40-50% | >60% |
|---|---|---|---|---|
| **Harvester** | ✅ Good day for harvesting. Dry | ⚠️ Suitable but watch light rain | ❌ Not recommended. Rain expected | ❌ |
| **Tractor** | ✅ Suitable | ⚠️ Okay, soil may be soft | ⚠️ | ❌ Not suitable, heavy rain |
| **Seeder** | ✅ Excellent for sowing | ⚠️ Check moisture | ❌ Too wet | ❌ |
| **Irrigation** | ✅ Good day for irrigation | ✅ | ❌ Not needed, rain expected | ❌ |

Displayed on booking page as: `🌦️ Wednesday — Rain 10% — ✅ Recommended for Harvester — Dry conditions expected.`

---

## 🌐 Language Support

Toggle `English | हिंदी` in header (persists in `localStorage`). All labels use `data-i18n` keys from `frontend/js/translations.js`:

```js
translations = { en: { nav_home:"Home", ... }, hi: { nav_home:"होम", ... } }
t(key), setLanguage('hi'), applyTranslations(), addLanguage('mr', {...})
```

Add a new language by calling `addLanguage('pa', { nav_home:"..." })`.

---

## 🔒 Security

- Passwords hashed with `bcryptjs` (10 rounds), never stored plain
- JWT `Bearer` auth, 7d expiry, `JWT_SECRET` in `.env`
- Parameterized SQLite queries (SQL injection tested: ` ' OR '1'='1` → 0 results)
- Input validation (email regex, phone `^[6-9]\d{9}$`, price >0, date `end >= start`)
- Owner checks (only owner can edit/delete equipment), renter ≠ owner booking block
- CORS `*` (tighten to your domain in production), no DB credentials exposed

---

## 📱 Responsive

Mobile-first CSS (`style.css`): sticky header with hamburger at `≤768px`, grid `1col mobile / 2col tablet / 3col desktop`, large buttons (`14-16px` padding), high-contrast green (`#2e7d32`) + amber (`#ff8f00`), card hover lift, accessible fonts.

---

## 🔄 User Flow

```
Login → Dashboard (Namaste, stats, weather) → Search Equipment → Details → Calendar (select  start/end) → Weather Rec → Total = Days×Price → Confirm → My Bookings → Owner manages incoming
```

Double-booking test: Equipment #1 booked `10 Aug → 15 Aug` → try `12 Aug → 18 Aug` → **rejected 409**; try `16 Aug → 20 Aug` → **allowed 201**.

---

## ☁️ Deployment — Vercel

**Live:** [https://krishi-yantra.vercel.app](https://krishi-yantra.vercel.app) — update this URL to your actual Vercel deployment URL (Dashboard → copy).

**Config (`vercel.json`):**
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/api" }] }
```
`api/index.js` exports Express app, `backend/server.js` conditionally listens (`if (require.main===module)`), `database.js` uses `/tmp/krishi.db` on Vercel (ephemeral, reseeded cold start; for persistence use Supabase/Neon).

**Deploy steps:**
1. Push to GitHub (already done)
2. https://vercel.com/new → Import `Dm9582/Krishi-Yantra` → Install `npm install` → no Build/Output needed
3. Env (optional): `JWT_SECRET`, `NODE_ENV=production`
4. Deploy → test `https://<your>.vercel.app/api/health`

**CLI:**
```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## 🤝 Contributing

PRs welcome! For major changes, open an issue first. Ensure `npm start` + `GET /api/health` passes and double-booking test still rejects overlap.

## 📄 License

MIT — see `LICENSE`.

---

> **Built for Bharat’s farmers — simple, affordable, nearby.** 🚜🇮🇳
