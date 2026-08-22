# Krishi Yantra - Farm Equipment Rental Platform

A simple platform for Indian farmers to rent and list farm equipment (tractors, harvesters, etc.) — nearby, affordable, and easy to use.

**Live Demo:** https://krishi-yantra.vercel.app  
**GitHub:** https://github.com/Dm9582/Krishi-Yantra

> If your Vercel URL is different, update the Live Demo link above to your actual `https://<project>.vercel.app`.

---

## Features
- List unused equipment for rent and earn
- Search equipment by name, category, location, price
- Book with calendar (shows booked dates, prevents double-booking)
- Weather info + advice for each equipment (e.g., good day for harvesting)
- Hindi / English language toggle
- Simple dashboard, bookings, and profile
- Works on mobile, tablet, and desktop

---

## Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (no framework)
- **Backend:** Node.js, Express
- **Database:** SQLite
- **Auth:** JWT + bcrypt
- **Deploy:** Vercel + GitHub

---

## Project Structure

```
krishi-yantra/
├── api/
│   └── index.js                 # For Vercel deployment
├── frontend/
│   ├── index.html               # Home page
│   ├── equipment.html           # Equipment listing with filters
│   ├── equipment-details.html   # Equipment details + calendar
│   ├── booking.html             # Booking page
│   ├── dashboard.html           # User dashboard
│   ├── login.html               # Login
│   ├── register.html            # Register
│   ├── list-equipment.html      # Add new equipment
│   ├── my-bookings.html         # View bookings
│   ├── weather.html             # Weather + recommendations
│   ├── profile.html             # User profile
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── main.js              # Common functions, nav, language
│       ├── translations.js      # Hindi / English texts
│       ├── equipment.js         # Equipment listing
│       ├── auth.js              # Login / register
│       ├── weather.js           # Weather
│       ├── calendar.js          # Booking calendar
│       └── booking.js           # Booking logic
├── backend/
│   ├── server.js                # Main server file
│   ├── routes/
│   │   ├── auth.js              # Login, register, profile
│   │   ├── equipment.js         # Equipment APIs
│   │   ├── bookings.js          # Booking APIs (double-booking check)
│   │   ├── weather.js           # Weather APIs
│   │   └── reviews.js           # Reviews
│   ├── middleware/
│   │   └── auth.js              # JWT check
│   ├── services/
│   │   └── weatherService.js    # Weather logic
│   └── config/
│       └── database.js          # Database setup and seed
├── database/
│   ├── schema.sql               # Tables: users, equipment, bookings, reviews
│   └── krishi.db                # Database file (auto-created)
├── vercel.json                  # Vercel config
├── package.json
├── .env.example
└── README.md
```

---

## How to Run Locally

```bash
git clone https://github.com/Dm9582/Krishi-Yantra.git
cd Krishi-Yantra
npm install
npm start
```

Open: http://localhost:3000

**Demo Accounts (password: `password123`):**
- ramesh@example.com — Sehore, MP
- priya@example.com — Ludhiana, Punjab
- arjun@example.com — Nashik, Maharashtra

Or create a new account at `/register.html`

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile

GET    /api/equipment
GET    /api/equipment/:id
POST   /api/equipment
PUT    /api/equipment/:id
DELETE /api/equipment/:id
GET    /api/equipment/:id/availability

POST   /api/bookings
GET    /api/bookings
GET    /api/bookings/:id
PUT    /api/bookings/:id
DELETE /api/bookings/:id

GET    /api/weather
GET    /api/weather/recommendation
GET    /api/reviews/:equipmentId
GET    /api/health
```

Booking price: `Total = Days × Price per day`  
Double-booking is blocked: same equipment cannot be booked for overlapping dates.

---

## Deployment (Vercel)

1. Push code to GitHub (already done)
2. Go to https://vercel.com/new → Import `Dm9582/Krishi-Yantra`
3. Click Deploy (no extra settings needed)
4. Test: `https://your-url.vercel.app/api/health` should return `{"status":"ok"}`

The project uses `vercel.json` and `api/index.js` for Vercel. Database uses `/tmp` on Vercel (demo data resets on cold start).

---

## License

MIT
