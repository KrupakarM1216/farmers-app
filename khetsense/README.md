# 🌾 KhetSense

AI-powered crop advisory agent for Indian farmers. A farmer enters a crop,
location and question; KhetSense fetches live weather + mandi prices and asks
Gemini for plain-language advice with a "why" explanation.

```
khetsense/
├── backend/                 # Node.js + Express API
│   ├── server.js            # app entry, CORS, health check
│   ├── db.js                # SQLite (better-sqlite3) query history
│   ├── routes/advisory.js   # POST /api/advice, GET /api/history
│   └── services/
│       ├── weather.js       # OpenWeatherMap: geocode + 5-day forecast
│       ├── mandi.js         # data.gov.in mandi price trend
│       └── gemini.js        # structured Gemini prompt -> JSON advice
└── frontend/                # React + Vite
    └── src/
        ├── App.jsx          # form -> loading -> advice card
        ├── api.js           # backend calls
        └── components/AdviceCard.jsx
```

## Run locally

**Backend**
```bash
cd backend
cp .env.example .env      # fill in the 3 API keys
npm install
npm run dev               # http://localhost:5000
```

**Frontend**
```bash
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:5000
npm install
npm run dev               # http://localhost:5173
```

## API keys (all free)
| Service        | Where                                            |
|----------------|--------------------------------------------------|
| Gemini         | https://aistudio.google.com/app/apikey           |
| OpenWeatherMap | https://openweathermap.org/api                   |
| data.gov.in    | https://data.gov.in (register → profile → API key)|

## Deploy (free tier)

**Backend → Render**
1. Push this repo to GitHub.
2. Render → New → Blueprint → pick the repo (`backend/render.yaml` is detected).
3. Add the three API keys + `CORS_ORIGIN` (your Vercel URL) as env vars.

**Frontend → Vercel**
1. Vercel → New Project → import repo → set **Root Directory** to `frontend`.
2. Add env var `VITE_API_URL` = your Render backend URL.
3. Deploy. `vercel.json` handles SPA routing.

## API
`POST /api/advice`
```json
{ "crop": "Tomato", "location": "Kolar", "question": "Should I sell now?", "language": "en" }
```
Returns `{ recommendation, reasoning, confidence_level, weather, price, warnings }`.
