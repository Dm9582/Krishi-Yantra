# Krishi Yantra - Farm Equipment Sharing Platform

Peer-to-peer farm equipment rental platform for Indian farmers.

## Features
- List unused machinery for rent
- Search nearby equipment
- Book tractors, harvesters, cultivators, seeders, irrigation
- Calendar with double-booking prevention
- Weather recommendations
- Hindi/English toggle
- Mobile-first design

## Tech Stack
- Frontend: HTML5, CSS3, Vanilla JS
- Backend: Node.js + Express
- Database: SQLite (sqlite3)
- Auth: JWT + bcryptjs

## Quick Start
```bash
cd krishi-yantra
npm install
npm start
# Open http://localhost:3000
```

Sample accounts:
- ramesh@example.com / password123 (Sehore, MP)
- priya@example.com / password123 (Ludhiana, Punjab)
- arjun@example.com / password123 (Nashik, Maharashtra)

## Project Structure
```
krishi-yantra/
├── frontend/
│   ├── index.html
│   ├── equipment.html
│   ├── equipment-details.html
│   ├── booking.html
│   ├── dashboard.html
│   ├── login.html
│   ├── register.html
│   ├── list-equipment.html
│   ├── my-bookings.html
│   ├── weather.html
│   ├── profile.html
│   ├── css/style.css
│   └── js/*.js
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── config/database.js
├── database/
│   ├── schema.sql
│   └── krishi.db
└── package.json
```

## API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET /api/equipment
- GET /api/equipment/:id
- POST /api/equipment
- PUT /api/equipment/:id
- DELETE /api/equipment/:id
- POST /api/bookings
- GET /api/bookings
- GET /api/bookings/:id
- PUT /api/bookings/:id
- DELETE /api/bookings/:id
- GET /api/weather?location=...
- GET /api/weather/recommendation?equipmentType=harvester&date=...

## Double-Booking Prevention
SQL overlap check: new booking rejected if exists where NOT (newEnd < existingStart OR newStart > existingEnd)

## Deployment - Vercel

This project is Vercel-ready.

**vercel.json** configured for @vercel/node to serve Express + static frontend:
`json
{
  "version": 2,
  "builds": [{ ""src"": ""backend/server.js"", ""use"": ""@vercel/node"" }],
  "routes": [{ ""src"": ""/(.*)"", ""dest"": ""backend/server.js"" }]
}
`

**Steps to Deploy:**
1. Push to GitHub (already at https://github.com/Dm9582/Krishi-Yantra.git)
2. Go to https://vercel.com/new → Import Git Repository → Select Dm9582/Krishi-Yantra
3. Vercel auto-detects Node.js, set:
   - Build Command: (empty, uses vercel.json)
   - Output Directory: (empty)
   - Install Command: 
pm install
4. Add Environment Variables (optional, defaults work):
   - JWT_SECRET = krishi_yantra_secret_2024_secure_key
   - NODE_ENV = production
5. Deploy → Vercel will build and assign https://krishi-yantra-*.vercel.app
6. Test: https://your-domain.vercel.app/api/health should return {status:""ok""}

**Local Vercel CLI:**
`ash
npm i -g vercel
vercel login
vercel --prod
`

**Note:** SQLite on Vercel uses /tmp/krishi.db (ephemeral, reseeded each cold start) - suitable for demo. For production persistence, swap to Postgres (Supabase/Neon) or Turso.

## Live Demo
- GitHub: https://github.com/Dm9582/Krishi-Yantra
- Vercel: _(add your deployment URL after import)_
