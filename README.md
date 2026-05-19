# 🛣️ RoadWatch AI v4 — Smart Road Intelligence System

> AI-powered road damage detection for Municipal Corporations, PWD Officers, and Urban Development Authorities across India.

```

### Manual
```bash
# Backend
cd backend && npm install && node src/server.js

# Frontend (new terminal)
cd frontend && npm install && npm run dev

# AI Service (optional, new terminal)
cd ai-service && pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port 8000

# Load 50 real incidents (run once)
cd backend && node src/seed.js
```

**Demo login:** `demo@roadwatch.ai` / `demo1234`

---

## 📁 Project Structure

```
RoadWatchAI/
├── start.bat / start.sh          ← One-click launchers
├── frontend/
│   ├── src/
│   │   ├── App.jsx               ← Full UI (5 tabs)
│   │   ├── components/
│   │   │   ├── AIDetectionCanvas.jsx     ← Real bbox rendering
│   │   │   ├── LeafletMapView.jsx        ← OSM + heatmap + markers
│   │   │   ├── BudgetOptimizer.jsx       ← Killer feature 1
│   │   │   ├── WardAccountability.jsx    ← Killer feature 2
│   │   │   └── PredictiveMaintenance.jsx ← Killer feature 3
│   │   ├── data/demoDetections.js        ← Real YOLOv8 results
│   │   ├── context/AuthContext.jsx
│   │   └── hooks/useApi.js
│   └── .env
├── backend/
│   ├── src/
│   │   ├── server.js             ← Express + Socket.IO
│   │   ├── seed.js               ← 50 real Indian incidents
│   │   ├── models/               ← User.js, Report.js
│   │   ├── middleware/auth.js    ← JWT
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── reports.js
│   │       ├── analytics.js
│   │       └── features.js       ← Budget + Wards + Predict
│   └── .env
└── ai-service/
    ├── main.py                   ← FastAPI + YOLOv8 (mock/real)
    └── requirements.txt
```

---

## 🌟 Features

| Feature | Description |
|---|---|
| **Real AI Detection** | Pre-computed YOLOv8n-CRDDC results with real bounding boxes, confidence scores, model watermark |
| **50 Real Incidents** | Seed data across Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad |
| **Live Map** | OpenStreetMap + heatmap, satellite/terrain toggle, custom risk-score markers |
| **Budget Optimizer** | Knapsack algorithm maximises risk reduction per rupee |
| **Ward Accountability** | A–D grades for councillors, resolution rates, pending costs |
| **Predictive Maintenance** | Monsoon risk, traffic analysis, clustering, degradation forecast |
| **Dark/Light Mode** | Instant toggle in header |
| **JWT Auth** | Sign in/up, role-based access, secure modal |
| **Real-time** | Socket.IO broadcasts new reports to all open tabs |
| **Fallback Data** | 15 incidents shown instantly without backend |

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/reports` | List reports (filter: severity, status) |
| POST | `/api/reports` | Submit report with image |
| PATCH | `/api/reports/:id/status` | Update status |
| GET | `/api/stats` | Dashboard stats |
| GET | `/api/trends` | 6-month trend data |
| GET | `/api/top-dangerous` | Top 10 risk locations |
| GET | `/api/features/budget?budget=5000000` | Budget optimizer |
| GET | `/api/features/wards` | Ward accountability |
| GET | `/api/features/predict` | Predictive maintenance |
| POST | `/detect` (AI) | YOLOv8 detection |

---

## 🗺️ Map Features
- **Dark road map** (CARTO Dark Matter) — default
- **Satellite** (Esri World Imagery)
- **Terrain** (OpenTopoMap)
- **Heatmap** (risk-weighted, monsoon red)
- **Custom markers** with risk score embedded
- **Rich popups** with severity, status, reporter

---

## 🧠 Risk Score Formula
```
Score = base_severity × 0.6 + confidence_bonus × 0.3 + frequency × 0.1
Low: 0-30 | Medium: 31-70 | High: 71-100
```

---

*RoadWatch AI — Because every pothole is a preventable accident.*
