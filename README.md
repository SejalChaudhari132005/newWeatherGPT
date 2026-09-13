# WeatherGPT - National Weather & Multi-Stakeholder Intelligence Platform

WeatherGPT is an AI-powered conversational and real-time meteorological platform designed for the diverse stakeholders of India: **Citizens**, **Farmers**, **Fishermen**, **Aviation Professionals (SkyRoute)**, **Disaster Managers**, **Urban Planners**, and **Atmospheric Researchers (WeatherLab)**.

---

## ⚡ Real-Time Data & Event Ingestion Architecture

WeatherGPT implements a hybrid **REST + WebSocket Push** architecture to close the hackathon real-time ingestion gap, adhering to modern meteorological data exchange patterns (WIS2.0-compatible).

```
                 WEATHER SOURCES
                       │
          ┌────────────┼────────────┐
          │            │            │
         IMD         Radar        INCOIS
       (Nowcast)   (DWR Sweeps) (High Swell)
          │            │            │
          └────────────┼────────────┘
                       ↓
           INGESTION & VALIDATION SERVICE (Pydantic Schema Validation)
                       ↓
            INTERNAL EVENT BUS (Deduplication & Latency Tracking)
                       ↓
            WEBSOCKET MANAGER (/ws/live-alerts Asynchronous Push Broadcast)
                       ↓
               WEATHERGPT CLIENT (Auto-Reconnect with Exponential Backoff)
                       ↓
       ┌───────────────┼───────────────┐
       ↓               ↓               ↓
    Alerts Page    WeatherLab Feed  Role Dashboards
(Dynamic Prepend) (Live Stream)  (Marine / Aviation / Agri)
```

### Architectural Principles:
1. **Initial Load via REST**: When pages load (e.g. `AlertsPage`, `WeatherLab`, `Dashboard`), historical and active baseline data are retrieved via standard REST endpoints (`GET /api/alerts`, `GET /api/weather`, `GET /api/radar`).
2. **Push Updates via WebSocket**: Live updates are pushed to connected clients over `ws://localhost:8000/ws/live-alerts`. Clients receive events instantaneously without polling or full-page refreshes.
3. **Event Normalization & Validation**: All incoming events are validated against strict Pydantic schemas (`BaseWeatherEvent`), ensuring required fields (`eventType`, `eventId`, `timestamp`, `source`, `severity`, `location`, `targetRoles`) are present.
4. **Stakeholder-Based Role Filtering**: Events are routed to relevant personas:
   - **Marine Warnings**: Pushed to Fishermen, Disaster Managers, Researchers.
   - **Aviation Wind Shear / METAR**: Pushed to SkyRoute / Aviation, Disaster Managers.
   - **Agricultural / Agromet Advisories**: Pushed to Farmers, Citizens.
   - **NWP Model Runs & Radar Sweeps**: Pushed to Researchers (WeatherLab).
   - **Severe Weather Alerts**: Broadcast to all roles.
5. **Data Integrity & Clear Labeling**: Simulated demonstration events are explicitly flagged (`is_demo: true`) and labeled in the UI as **`DEMO REAL-TIME EVENT`** or **`DEMO STREAM`**, preserving integrity and never masquerading as real unverified IMD data.
6. **WIS2.0 Integration Status**: Architecture prepared for WIS2.0 / event-based meteorological ingestion; current local demonstration uses a controlled event simulator and WebSocket delivery.

---

## 🚀 Key Features

- 🌐 **Real-Time WebSocket Push**: Sub-second latency event delivery over `/ws/live-alerts`.
- 🧪 **WeatherLab (Researcher Suite)**: High-resolution NWP comparison (WRF, GFS, ECMWF, NCUM), convective indices (CAPE/CIN), sounding profiles, radar reflectivity previews, and climate anomaly analysis.
- 🌾 **Farmer Intelligence**: Agromet advisories, soil moisture modeling, spray windows, and crop disease alerts.
- ⚓ **Fisherman Coastal Intelligence**: INCOIS wave height telemetry, tidal charts, swell periods, and harbour-bound safety advisories.
- ✈️ **SkyRoute (Aviation Intelligence)**: METAR/TAF decoders, crosswind calculators, runway visual ranges, and turbulence nowcasts.
- 🗣️ **BHASHINI Multilingual & Voice Layer**: Conversational weather queries in Hindi, Marathi, Bengali, Tamil, Telugu, and English.
- 🗺️ **Dynamic Multi-Layer Radar & Maps**: Doppler radar layers, rainfall accumulations, cloud cover, and storm tracking.

---

## 🛠️ Getting Started

### 1. Backend (FastAPI + WebSocket)
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```
- API Docs: `http://localhost:8000/docs`
- WebSocket Endpoint: `ws://localhost:8000/ws/live-alerts`
- Health Endpoint: `http://localhost:8000/api/realtime/health`

### 2. Frontend (React + TypeScript + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🎛️ Hackathon Demonstration Flow (Judge Walkthrough)

1. Open WeatherGPT at `http://localhost:5173`.
2. Notice the **`● REAL-TIME CONNECTED`** badge in the header.
3. Click the Real-Time badge (or open the Demo Control Panel).
4. Click **`Send Weather Alert (Orange)`** or **`Send Marine Warning`**.
5. Observe the sub-second in-app notification toast and notice the alert appears in the **Alerts Page** / **WeatherLab Feed** immediately **WITHOUT ANY PAGE REFRESH**.
