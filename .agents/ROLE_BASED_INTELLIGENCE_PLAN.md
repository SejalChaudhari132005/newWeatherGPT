# WeatherGPT: The Role-Aware Weather Decision Intelligence Platform
## Comprehensive Architecture & Specification for All Specialized Roles

**Core Axiom:** *"One Weather Event. Different Decisions."*  
**Problem Statement ID:** 26068 (Ministry of Earth Sciences — India Meteorological Department)  
**File Location:** `newWeatherGPT/.agents/ROLE_BASED_INTELLIGENCE_PLAN.md`  
**Last Updated:** 2026-09-13

---

## 1. Strategic Decision Intelligence Framework

IMD, ECMWF, and NOAA provide accurate raw observations and NWP model predictions. **WeatherGPT's signature breakthrough is transforming shared meteorological telemetry into role-specific, grounded operational decisions.**

```
                               ┌─────────────────────────────────────────────────────────┐
                               │                    ONE WEATHER EVENT                    │
                               │           (e.g., Advancing Rain & High Winds)           │
                               └────────────────────────────┬────────────────────────────┘
                                                            │
    ┌──────────────────────┬──────────────────────┬─────────┴────────────┬──────────────────────┬──────────────────────┐
    │                      │                      │                      │                      │                      │
    ▼                      ▼                      ▼                      ▼                      ▼                      ▼
🌾 FARMER              🎣 FISHERMAN           ✈️ AVIATION            🔬 RESEARCHER          🚨 DISASTER MGR        🌆 URBAN PLANNER
────────────────────   ────────────────────   ────────────────────   ────────────────────   ────────────────────   ────────────────────
Field-to-Action Crop   Safe-to-Sail & Return  Conversational Flight  Multi-Model NWP &      Situational Triage &   Infrastructure &
Advisor                Time Intelligence      Weather Briefing       Climate Anomaly Lab    Emergency Protocol     Heat Island Engine
────────────────────   ────────────────────   ────────────────────   ────────────────────   ────────────────────   ────────────────────
• Spraying Wash-Off    • Safe-to-Sail Gauge   • Runway Crosswind     • GFS vs ECMWF vs      • 🚨 Situational Risk  • 🌆 Urban Flood &
  & Drift Risk           (Go / Caution /        Resolver ($360^\circ$) IMD WRF Consensus     Hero (Active Alerts,    Waterlogging Risk
• Best Farming           No Departure)        • METAR / TAF Plain-   • 30-Year Baseline       Rainfall Intensity,  • Peak Rain Window
  Windows (Spray,      • Return-Time Cutoff     English Decoder        Anomalies (1991-2020)  Affected Districts)     (e.g. 4–7 PM)
  Irrigate, Harvest)     (Deterioration Curve)• VFR / MVFR / IFR /   • NetCDF/GRIB Datasets • Lightning & Flood    • Critical Infra
• Soil Moisture &      • Near-shore / Deep      LVP Flight Rules     • Automated Academic     Triage Matrix          Exposure (3 zones)
  ET0 Balance            Sea Zone Danger      • Aerodrome Compare      Report Generator     • Evacuation Route &   • Heat Island &
• Pest Infection Risk  • INCOIS / Coast Guard • Period Requiring     • Grounded Scientific    Helpline Broadcast      Drainage Runoff
• Vernacular Voice       Emergency Broadcast    Attention Banner       Query Assistant      • Dark Blue + Amber/    • Blue / Slate
  Advisories           • Marine Audio Voice   • Operations Chat      • WebSocket Telemetry    Red Warning Accents     Municipal Theme
```

---

## 2. Role Specifications & Visual Identities

---

### 2.1. 🌾 FARMER: Field-to-Action Crop Advisor
> **Signature Pitch:** *"From weather forecast to farm action."*  
> **UI Dashboard:** `🌾 MY FARM` — *Weather for your crop*  
> **Visual Identity:** EMERALD GREEN (`#059669` / `#10B981`) + WARM EARTH TONES

#### Core Decision Engines:
1. **Chemical Spraying Risk Engine:**
   - Evaluates rain within 4 hours of planned spray (wash-off risk) and wind $>12\text{ km/h}$ (drift risk).
   - Generates Go / Caution / No-Go status with rainfast adjuvant recommendations.
2. **Best Farming Windows Engine:**
   - Computes hourly suitability scores (0–100) for Spraying, Irrigation, and Harvesting over 48 hours.
3. **Soil Moisture & $\text{ET}_0$ Balance:**
   - Evaluates surface ($0-7\text{ cm}$) vs root zone ($7-28\text{ cm}$) moisture and FAO-56 Penman-Monteith reference evapotranspiration.
4. **Pest & Disease Infection Propensity:**
   - Thermal-humidity infection models for Soybean, Cotton, Wheat, Rice, Sugarcane, and Groundnut with IPM remedies.
5. **1-Tap Vernacular Voice:** Regional speech synthesis (Marathi, Hindi, Telugu, Tamil, Kannada) via MeitY BHASHINI.

---

### 2.2. 🎣 FISHERMAN: Safe-to-Sail Decision Agent
> **Signature Pitch:** *"Know when to sail, where the risk is, and when to return."*  
> **UI Dashboard:** `🎣 MY SEA` — *Weather for your fishing zone*  
> **Visual Identity:** OCEAN CYAN (`#0891B2` / `#06B6D4`) + NAVY BLUE

#### Core Decision Engines:
1. **Safe-to-Sail Clearance Gauge:**
   - Ingests significant wave height ($H_s$), swell period, gust factors, and IMD/INCOIS marine bulletins.
   - Status: 🟢 Favorable ($H_s < 1.4\text{m}$) | 🟡 Caution ($1.4-2.5\text{m}$) | 🔴 No Departure ($> 2.5\text{m}$).
2. **Return-Time Intelligence (Deterioration Curve):**
   - Scans forward hourly wave/wind curves to determine the exact return deadline before dangerous conditions develop.
3. **Semi-Diurnal Tide Extrema:**
   - Harmonic tide prediction models for West Coast (macro-tidal) vs East Coast (micro-tidal) Indian coastal harbors.
4. **Zone-Tiered Coastal Matrix:**
   - Near-Shore ($0-5\text{ nm}$), Coastal ($5-20\text{ nm}$), Deep-Sea ($>20\text{ nm}$).
5. **Marine Emergency Broadcast:**
   - Indian Coast Guard SOS (1554), Marine Police (1093), VHF Ch 16, and cyclone warnings.

---

### 2.3. ✈️ AVIATION: Conversational Flight Weather Briefing
> **Signature Pitch:** *"Complex aviation weather, one conversational briefing."*  
> **UI Dashboard:** `✈️ MY OPERATIONS` — *Weather for aviation decisions*  
> **Visual Identity:** SKY BLUE (`#0284C7` / `#38BDF8`) + COCKPIT SLATE

#### Core Decision Engines:
1. **Runway Crosswind & Headwind Vector Resolver:**
   - Trigonometric resolution across $360^\circ$ for Indian international airports (VABB, VIDP, VOBL, VOMM, VAPO, etc.):
     $$\text{Crosswind} = V_{\text{wind}} \cdot |\sin(\theta_{\text{wind}} - \theta_{\text{runway}})|$$
     $$\text{Headwind} = V_{\text{wind}} \cdot \cos(\theta_{\text{wind}} - \theta_{\text{runway}})$$
   - Operational limits: Normal $\le 15\text{ kts}$, Caution $15\text{–}25\text{ kts}$, Exceeded $>25\text{ kts}$.
2. **Flight Category Classifier:**
   - VFR ($\text{Ceiling} \ge 3000\text{ ft}, \text{Vis} \ge 5000\text{ m}$), MVFR ($\text{Ceiling} \ge 1000\text{ ft}, \text{Vis} \ge 3000\text{ m}$), IFR ($\text{Ceiling} \ge 500\text{ ft}, \text{Vis} \ge 1000\text{ m}$), LVP ($< 500\text{ ft}$ or $< 1000\text{ m}$).
3. **Interactive METAR / TAF Tokenized Decoder:**
   - Translates raw ICAO strings into categorized, plain-English operational summaries.
4. **Dual Aerodrome Comparison & Enroute Hazard Rating:**
   - Side-by-side landing comparison between alternate diversion airports.

---

### 2.4. 🔬 RESEARCHER: WeatherLab Scientific Workspace
> **Signature Pitch:** *"Multi-model consensus, climate anomalies, and open scientific data."*  
> **UI Dashboard:** `🔬 WEATHERLAB` — *Atmospheric Research Workspace*  
> **Visual Identity:** COBALT BLUE (`#2563EB` / `#3B82F6`) + LABORATORY INDIGO

#### Core Decision Engines:
1. **Multi-Model NWP Intercomparison & Consensus Engine:**
   - Compares raw model outputs from GFS (NOAA), ECMWF (European Centre), IMD/WRF, and ICON (DWD).
   - Computes Consensus Rating (HIGH / MODERATE / LOW), model disagreement analysis, and uncertainty bounds.
2. **30-Year Climatological Baseline Anomaly Engine:**
   - Evaluates current meteorological observations against standard 1991–2020 normal baselines.
   - Computes temperature departure ($\Delta^\circ\text{C}$), seasonal rainfall deviation ($\% \text{ departure}$), and extreme event counts.
3. **Open Scientific Datasets Catalog:**
   - Direct download links for ERA5 Reanalysis, IMD 0.25° Gridded Rainfall, INSAT-3DR Satellite Imagery, and CAMS Air Quality datasets.
4. **Automated Academic Research Report Generator:**
   - Synthesizes structured markdown and downloadable PDF reports containing study area, data sources, methodology, statistics, key findings, and formal citations.
5. **Real-Time WebSocket Telemetry Stream:**
   - `/ws/weather` real-time push for new model runs, atmospheric anomaly events, and sensor updates.

---

### 2.5. 🚨 DISASTER MANAGER: Situational Weather Intelligence (Theme 8)
> **Signature Pitch:** *"Actionable situational intelligence for emergency response and flood triage."*  
> **UI Dashboard:** `🚨 SITUATIONAL WEATHER INTELLIGENCE` — *Disaster Operations Center*  
> **Role Badge:** `DISASTER MANAGER`  
> **Visual Identity:** **DARK BLUE (`#0A192F` / `#0F243E`) + AMBER/RED WARNING ACCENTS**  
> **Background Atmosphere:** Storm, heavy rain, flood-prone urban environment, emergency management operations center atmosphere, satellite/weather-radar inspired visual.  
> **Color Rule:** *Do NOT make the entire screen red. Red represents active critical risk only.*

#### A. Hero Priority: 🚨 SITUATIONAL WEATHER INTELLIGENCE
The hero card prioritizes immediate operational risk and early warning triage:
- **Current Risk Level:** `LOW` | `MODERATE` | `HIGH` | `SEVERE / CRITICAL`
- **Active Alerts Stream:** Live IMD Red/Orange alerts, Cloudburst indicators, Heavy Rain Warnings.
- **Rainfall Intensity:** Hourly rate ($\text{mm/h}$), 24h accumulation, and flash flood index.
- **Flood Risk Level:** River basin runoff, low-lying waterlogging, and catchment saturation.
- **Wind & Gust Hazards:** Sustained wind speed, maximum gust speed, squall direction.
- **Lightning Activity:** Strikes/hour in radar radius, convective cloud cell trajectory.
- **Affected Areas:** Specific districts, sub-divisions, river basins, and talukas.
- **Recency:** "Updated 2 min ago" live heartbeat.

```
┌────────────────────────────────────────────────────────────────────────┐
│  🚨 SITUATIONAL WEATHER INTELLIGENCE              [ DISASTER MANAGER ] │
├────────────────────────────────────────────────────────────────────────┤
│  🚨 Regional Risk: Heavy Rain Alert                                    │
│  Risk Level: HIGH                 Affected Area: Pune District        │
│  Rainfall: 68 mm/h (Extreme)      Flood Risk: HIGH (Mula-Mutha Basin)  │
│  Wind: 42 km/h (Gusts 65 km/h)    Lightning: 18 strikes/10km (Active)  │
│  Updated: 2 min ago               Official Source: IMD Official Red    │
└────────────────────────────────────────────────────────────────────────┘
```

#### B. Component Architecture:
1. `SituationalRiskHeroCard.tsx`: Master triage hero with risk severity pill, live alert banner, and telemetry meters.
2. `ActiveAlertsStreamCard.tsx`: Feed of live IMD warnings with severity tags, valid time windows, and affected administrative zones.
3. `RainfallIntensityFloodGauge.tsx`: Dual meter comparing hourly rainfall intensity against flash flood thresholds ($>15\text{ mm/h}$ moderate, $>35\text{ mm/h}$ severe, $>50\text{ mm/h}$ cloudburst).
4. `LightningWindHazardCard.tsx`: Convective hazard radar tracking lightning strike frequency and squall gusts.
5. `VulnerableZonesTriageCard.tsx`: List of high-risk talukas/wards with critical infrastructure vulnerability ratings (Hospitals, Substations, Bridges).
6. `EmergencyBroadcastHelplineCard.tsx`: 1-tap quick connect to NDRF (1078), SDRF, District Emergency Operations Center (DEOC), and Fire/Rescue.

---

### 2.6. 🌆 URBAN PLANNER: Urban Weather Intelligence (Theme 9)
> **Signature Pitch:** *"Resilient urban infrastructure, waterlogging mitigation, and heat island intelligence."*  
> **UI Dashboard:** `🌆 URBAN WEATHER INTELLIGENCE` — *Municipal Weather Resilience*  
> **Role Badge:** `URBAN PLANNER`  
> **Visual Identity:** **BLUE / SLATE (`#0F172A` / `#1E293B` / `#334155`) with SKY BLUE ACCENTS**  
> **Background Atmosphere:** City skyline, roads, urban drainage, civil infrastructure, concrete density vs green canopy atmosphere.

#### A. Hero Priority: 🌆 URBAN WEATHER INTELLIGENCE
The hero card prioritizes municipal drainage capacity, flood exposure, and heat island mitigation:
- **Urban Flood Risk:** `LOW` | `MEDIUM` | `HIGH` | `CRITICAL`
- **Rainfall Accumulation:** Cumulative forecast rainfall (e.g., $42\text{ mm}$).
- **Peak Intensity Window:** Exact timing of highest drainage load (e.g., `4:00 PM – 7:00 PM`).
- **Critical Infrastructure Exposure:** Number of exposed municipal zones (e.g., `3 zones: Metro Line 3 underpass, Hindmata junction, Milan subway`).
- **Temperature & Heat Island Index:** Urban surface temperature vs suburban baseline ($\Delta T_{\text{UHI}}$).
- **Waterlogging Risk Level:** Stormwater drain runoff capacity vs peak precipitation rate.
- **Wind Exposure:** High-rise canyon wind gusts and crane/hoarding safety thresholds.

```
┌────────────────────────────────────────────────────────────────────────┐
│  🌆 URBAN WEATHER INTELLIGENCE                     [ URBAN PLANNER ]   │
├────────────────────────────────────────────────────────────────────────┤
│  Urban Flood Risk: MEDIUM                                              │
│  Rainfall: 42 mm                  Peak Window: 4:00 PM – 7:00 PM       │
│  Critical Infrastructure: 3 zones Temperature: 34°C (UHI: +3.2°C)      │
│  Drainage Inflow: 78% Capacity    Wind Gusts: 38 km/h (Canyon Effect)  │
│  Updated: 5 min ago               Municipal Division: Ward K-West      │
└────────────────────────────────────────────────────────────────────────┘
```

#### B. Component Architecture:
1. `UrbanWeatherHeroCard.tsx`: Slate-themed municipal overview with flood risk, peak rainfall window, and infrastructure count.
2. `WaterloggingHotspotsCard.tsx`: Geo-tagged list of chronic waterlogging junctions and underpasses with estimated inundation depth (cm).
3. `HeatIslandVulnerabilityCard.tsx`: Microclimate thermal map identifying high concrete density heat islands vs green cooling zones.
4. `DrainageRunoffTimeline.tsx`: Hourly timeline correlating hourly rainfall with stormwater drain capacity limits.
5. `InfrastructureExposureCard.tsx`: Status matrix for Metro, Railway tracks, Power substations, and Highway arterial corridors.
6. `MunicipalAdvisoryExportCard.tsx`: 1-click generation of Ward Officer Weather Bulletins for municipal engineering staff.

---

### 2.7. 👤 CITIZEN: Everyday Living Weather Intelligence
> **Signature Pitch:** *"Clear, simple weather intelligence for daily life."*  
> **UI Dashboard:** `👤 CITIZEN DASHBOARD`  
> **Visual Identity:** CLEAN WHITE / SKY BLUE (`#0284C7` / `#F0F9FF`)

---

## 3. Implementation Plan & Delivery Schedule

### Phase 7: Disaster Manager Implementation Plan
1. **Backend Service (`backend/app/services/disaster_weather_service.py`):**
   - Ingests IMD severe warnings, Open-Meteo precipitation rates, CAPE, and lightning strike proxies.
   - Calculates situational risk score, flood propensity, and vulnerable zone exposure.
2. **Backend Agent (`backend/app/agents/disaster_agent.py`):**
   - Upgrades `DisasterAgent` to full `RoleAgent` generating grounded emergency advisories.
3. **Backend API Route (`backend/app/api/routes/disaster.py`):**
   - Endpoints: `GET /api/roles/disaster/situational-risk`, `GET /api/roles/disaster/alerts-stream`, `GET /api/roles/disaster/vulnerable-zones`.
4. **Frontend Dashboard (`frontend/src/pages/DisasterDashboardPage.tsx`):**
   - Dark Blue + Amber/Red theme, Situational Hero Card, Active Alerts Stream, Rainfall/Flood Gauge, Lightning tracker, Emergency helplines.

### Phase 8: Urban Planner Implementation Plan
1. **Backend Service (`backend/app/services/urban_planner_service.py`):**
   - Ingests precipitation intensity, surface temperature, humidity, and wind.
   - Calculates runoff load vs drainage capacity, Urban Heat Island ($\Delta T$), and critical infrastructure exposure.
2. **Backend Agent (`backend/app/agents/urban_agent.py`):**
   - Full `UrbanPlannerAgent(RoleAgent)` providing municipal resilience advice.
3. **Backend API Route (`backend/app/api/routes/urban.py`):**
   - Endpoints: `GET /api/roles/urban/flood-risk`, `GET /api/roles/urban/heat-island`, `GET /api/roles/urban/infrastructure`.
4. **Frontend Dashboard (`frontend/src/pages/UrbanPlannerDashboardPage.tsx`):**
   - Blue / Slate municipal theme, Urban Flood Risk Hero Card, Waterlogging Hotspots, Heat Island Card, Drainage Runoff timeline.

### Phase 9: Verification & Integration QA
- Comprehensive unit and integration test suite across all 7 roles.
- End-to-end multi-role routing and UI verification.
