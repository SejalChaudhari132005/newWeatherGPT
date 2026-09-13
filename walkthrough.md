# Walkthrough: Disaster Manager (Theme 8) & Urban Planner (Theme 9) Live Dashboards

We have completed the full implementation of both **Phase 1: Disaster Manager Theme & Live Dashboard** and **Phase 2: Urban Planner Theme & Live Dashboard**, strictly adhering to the government portal design system (`bg-[#F5F7F9]`, white `.gov-panel` cards with `#D6DCE1` borders, `#17365D` headers, zero text clipping or boundary overlap, and 100% live computed data from Open-Meteo & IMD).

---

## 1. Government Design System Standards Applied

All cards and pages across both roles strictly adhere to:
- **Background & Card Styling:** Light page background `bg-[#F5F7F9]`, white cards `.gov-panel` (`bg-white`), borders `border border-[#D6DCE1]`, standard headers `bg-[#F8FAFC]` with border bottom `border-b border-[#D6DCE1]`.
- **National Blue Brand Typography:** Headers in `#17365D` uppercase tracking-wider, subtext in `#5B6770`, high-contrast text `#1F2933`.
- **Strict Boundary & Responsive Alignment:**
  - All card containers have explicit `min-w-0`, `truncate`, and responsive padding to ensure no text overflows or overlaps regardless of screen size.
  - Progress bar ticks and gauge steps use clean 4-column grids with centered/boundary-aligned labels (`text-[8.5px]`).
  - Emergency contact and hotspot cards use flexible flex-row layouts with `shrink-0` badges so text is never compressed.

---

## 2. Phase 1: 🚨 Disaster Manager (Situational Weather Intelligence)

### A. Core Architecture & Backend
- **Schemas:** [`backend/app/schemas/disaster.py`](file:///d:/My_Space/newWeatherGPT/backend/app/schemas/disaster.py) (`SituationalRiskData`, `ActiveAlertItem`, `VulnerableZoneItem`, `DisasterBriefingResponse`).
- **Live Decision Engine:** [`backend/app/services/disaster_weather_service.py`](file:///d:/My_Space/newWeatherGPT/backend/app/services/disaster_weather_service.py) (computes real-time rainfall rate $\text{mm/h}$, 24h accumulation, flood vulnerability score $0\text{–}100$, lightning strike density, convective CAPE, and district catchment triage).
- **Agent & Router:** [`backend/app/agents/disaster_agent.py`](file:///d:/My_Space/newWeatherGPT/backend/app/agents/disaster_agent.py) registered in `role_router.py`.
- **REST Endpoints:** [`backend/app/api/routes/disaster.py`](file:///d:/My_Space/newWeatherGPT/backend/app/api/routes/disaster.py) mounted under `/api/roles/disaster/*`.

### B. Frontend Components Suite
- **[`SituationalRiskHeroCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/disaster/SituationalRiskHeroCard.tsx):**
  - Title: `🚨 Situational Weather Intelligence`
  - Role Badge: `DISASTER MANAGER`
  - Regional Risk headline (e.g. *Heavy Rain Alert*), Risk Level (`HIGH`/`CRITICAL`), Affected Area (`Pune District`), 4-metric grid (Rainfall Rate, Flood Risk, Wind/Gusts, Lightning Strikes).
- **[`ActiveAlertsStreamCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/disaster/ActiveAlertsStreamCard.tsx):** IMD Red/Orange alert stream with impact zones and operational directives.
- **[`RainfallIntensityFloodGauge.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/disaster/RainfallIntensityFloodGauge.tsx):** Dual gauge comparing rainfall rate vs cloudburst thresholds ($>50\text{ mm/h}$) and hydrologic flood vulnerability ($0\text{–}100$).
- **[`LightningWindHazardCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/disaster/LightningWindHazardCard.tsx):** Convective CAPE energy ($\text{J/kg}$) & lightning strike frequency per 10km radius.
- **[`VulnerableZonesTriageCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/disaster/VulnerableZonesTriageCard.tsx):** Administrative taluka/ward exposure with exposed population and critical assets (Hospitals, Substations, Bridges).
- **[`EmergencyBroadcastHelplineCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/disaster/EmergencyBroadcastHelplineCard.tsx):** Direct tap-to-call hotlines for NDRF (1078), SDMA (1070), DEOC (1077), and Flood Rescue.
- **Master Pages:** [`DisasterWeatherPage.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/pages/DisasterWeatherPage.tsx) & [`DisasterDashboardPage.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/pages/DisasterDashboardPage.tsx).

---

## 3. Phase 2: 🌆 Urban Planner (Urban Weather Intelligence)

### A. Core Architecture & Backend
- **Schemas:** [`backend/app/schemas/urban_planner.py`](file:///d:/My_Space/newWeatherGPT/backend/app/schemas/urban_planner.py) (`UrbanWeatherIntelligenceData`, `WaterloggingHotspot`, `DrainageRunoffMetric`, `HeatIslandMetric`, `InfrastructureExposureItem`, `UrbanPlannerBriefingResponse`).
- **Live Decision Engine:** [`backend/app/services/urban_planner_service.py`](file:///d:/My_Space/newWeatherGPT/backend/app/services/urban_planner_service.py):
  - Rational Method runoff calculations ($Q = C \cdot I \cdot A$ with runoff coefficient $C = 0.78$ for impervious urban core).
  - Peak rainfall window detection (e.g. `4:00 PM – 7:00 PM`).
  - Urban Heat Island ($\Delta T_{\text{UHI}}$) thermal anomaly calculation ($+2.5^\circ\text{C}$ to $+4.5^\circ\text{C}$).
  - Waterlogging underpass depth predictions and municipal drainage surcharge utilization %.
- **Agent & Router:** [`backend/app/agents/urban_agent.py`](file:///d:/My_Space/newWeatherGPT/backend/app/agents/urban_agent.py) registered in `role_router.py`.
- **REST Endpoints:** [`backend/app/api/routes/urban.py`](file:///d:/My_Space/newWeatherGPT/backend/app/api/routes/urban.py) mounted under `/api/roles/urban/*`.

### B. Frontend Components Suite
- **[`UrbanWeatherHeroCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/urban/UrbanWeatherHeroCard.tsx):**
  - Title: `🌆 Urban Weather Intelligence`
  - Role Badge: `URBAN PLANNER`
  - Urban Flood Risk (`HIGH`/`MODERATE`), Rainfall Amount ($42\text{ mm}$), Peak Rainfall Window (`4:00 PM – 7:00 PM`), Critical Infrastructure Risk ($3\text{ zones}$), Stormwater Surcharge Utilization progress bar.
- **[`WaterloggingHotspotsCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/urban/WaterloggingHotspotsCard.tsx):** Underpass and lowlands triage with elevation dips ($-2.4\text{ m}$), predicted inundation depth ($35\text{ cm}$), and municipal pumping directives.
- **[`DrainageRunoffTimeline.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/urban/DrainageRunoffTimeline.tsx):** 4-interval hydrograph comparing projected rainfall runoff vs design discharge capacity ($m^3/\text{hr}$).
- **[`HeatIslandVulnerabilityCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/urban/HeatIslandVulnerabilityCard.tsx):** Microclimate thermal anomalies vs tree canopy cover and impervious concrete percentages.
- **[`InfrastructureExposureCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/urban/InfrastructureExposureCard.tsx):** Metro station concourses, hospital emergency access routes, underpasses, and power substations with specific civil engineering actions.
- **Master Pages:** [`UrbanPlannerWeatherPage.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/pages/UrbanPlannerWeatherPage.tsx) & [`UrbanPlannerDashboardPage.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/pages/UrbanPlannerDashboardPage.tsx).

---

## 4. Navigation, Routing & Role Switcher Integration

- **[`ProfileModal.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/profile/ProfileModal.tsx):** Includes both `Disaster Manager` (ShieldAlert) and `Urban Planner` (Building2) with one-click switching that instantly navigates to their respective live dashboards.
- **[`RoleDashboardSwitcher.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/RoleDashboardSwitcher.tsx):** Features `DISASTER OPS` and `URBAN PLANNING` tabs.
- **[`App.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/App.tsx) & [`MobileAppShell.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/layout/MobileAppShell.tsx):** Seamless dynamic routing, top portal badges, and bottom dock navigation icons for all roles.

---

## 5. Automated Verification Suites

- **Disaster Role Tests:** [`backend/tests/test_roles_disaster.py`](file:///d:/My_Space/newWeatherGPT/backend/tests/test_roles_disaster.py) (Tests situational risk evaluation, active alerts stream, flood scores, lightning proxies, DisasterAgent registration, and REST endpoints).
- **Urban Role Tests:** [`backend/tests/test_roles_urban.py`](file:///d:/My_Space/newWeatherGPT/backend/tests/test_roles_urban.py) (Tests urban intelligence metrics, waterlogging hotspots, drainage hydrograph timeline, UHI zones, UrbanAgent registration, and REST endpoints).
