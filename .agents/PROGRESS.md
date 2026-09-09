# WeatherGPT: Implementation Progress Tracker

**Problem Statement ID:** 26068 (Ministry of Earth Sciences — India Meteorological Department)  
**Core Initiative:** Role-Aware Weather Decision Intelligence (*"One Weather Event. Different Decisions."*)  
**Last Updated:** 2026-09-09

---

## Overall Roadmap Status

| Phase | Title | Target Timeline | Status | Highlights / Deliverables |
| :--- | :--- | :---: | :---: | :--- |
| **Phase 1** | **Architectural Foundation & Unified Data Contracts** | Days 1–4 | 🟢 **COMPLETED** | Ingestion extensions in `open_meteo.py`, Pydantic contracts in `role_intelligence.py`, REST endpoints in `roles.py`, test suite in `test_roles_phase1.py`. |
| **Phase 2** | **🌾 Farmer Intelligence Engine & "My Farm" Dashboard** | Days 5–10 | 🟢 **COMPLETED** | `AgriWeatherService`, full conversational `FarmerAgent`, `FarmerDashboardPage.tsx`, `FarmingWindowsTimeline`, `SprayingRiskCard`, `SoilMoistureGauge`, `PestDiseaseRiskCard`, `VernacularVoiceButton`, `test_roles_phase2.py`. |
| **Phase 3** | **🎣 Marine Intelligence Engine & "My Sea" Dashboard** | Days 11–16 | 🟢 **COMPLETED** | `MarineWeatherService`, return-time cutoff engine, `FishermanAgent`, `FisherDashboardPage.tsx` with safe-to-sail hero gauge, tide schedule, zone danger matrix, SOS broadcast, `test_roles_phase3.py`. |
| **Phase 4** | **✈️ Aviation Meteorological Engine & "My Operations" Dashboard** | Days 17–22 | 🟢 **COMPLETED** | `AviationWeatherService`, runway crosswind vector resolver across $360^\circ$, METAR/TAF tokenized decoder, `AviationAgent`, `AviationDashboardPage.tsx`, `AirportComparisonModal.tsx`, `test_roles_phase4.py`. |
| **Phase 5** | **Multi-Agent Orchestration & Conversational Binding** | Days 23–26 | 🟢 **COMPLETED** | `role_router.py` dynamic domain dispatch, `intent_agent.py` multi-role intent classification, `orchestrator_agent.py` role-aware geolocation and dynamic action buttons, BHASHINI TTS integration in `useVoice.ts`, `test_roles_phase5.py`. |
| **Phase 6** | **Verification, Mathematical Testing & End-to-End QA** | Days 27–30 | ⏳ **UPCOMING** | FAO-56 $\text{ET}_0$ math checks, wave height boundary tests, crosswind trigonometric verification across $360^\circ$. |

---

## Detailed Milestone Log

### Phase 1: Architectural Foundation & Unified Data Contracts (🟢 COMPLETED)

- [x] **Open-Meteo Documentation Review & Telemetry Verification:**
  - Researched live Open-Meteo API documentation and verified live endpoints for agricultural, atmospheric, and marine parameters.
- [x] **Provider Ingestion Layer ([`backend/app/providers/weather/open_meteo.py`](file:///d:/My_Space/newWeatherGPT/backend/app/providers/weather/open_meteo.py)):**
  - Added agricultural variables (`soil_moisture_0_to_7cm`, `soil_moisture_7_to_28cm`, `et0_fao_evapotranspiration`, `soil_temperature_0cm`, `vapour_pressure_deficit`).
  - Added aviation/convective variables (`cloud_cover_low/mid/high`, `visibility`, `surface_pressure`, `dew_point_2m`, `wind_gusts_10m`, `cape`).
  - Implemented `fetch_marine_weather(latitude, longitude)` querying `https://marine-api.open-meteo.com/v1/marine` for wave height, swell height, wave period, and ocean currents.
- [x] **Strict Pydantic Data Contracts ([`backend/app/schemas/role_intelligence.py`](file:///d:/My_Space/newWeatherGPT/backend/app/schemas/role_intelligence.py)):**
  - `FarmerDecisionData`, `SoilStateData`, `FarmingWindowSlot`, `SprayingRiskAssessment`, `PestDiseaseRisk`, `FarmerDecisionResponse`.
  - `MarineDecisionData`, `SailingClearance`, `TemporalMarineSlot`, `ReturnTimeAnalysis`, `ZoneRisk`, `SeaStateSummary`, `MarineDecisionResponse`.
  - `AviationBriefingData`, `FlightRules`, `RunwayWindComponent`, `PeriodRequiringAttention`, `DecodedMetarTaf`, `AirportComparisonData`, `AirportCatalogItem`.
- [x] **REST API Endpoints ([`backend/app/api/routes/roles.py`](file:///d:/My_Space/newWeatherGPT/backend/app/api/routes/roles.py)):**
  - `GET /api/roles/airports`: Catalog of Indian international airports with magnetic runway bearings (VABB, VIDP, VOBL, VOMM, VAPO, VOHS, VECC, VOCI, VAAH, VOGO).
  - `GET /api/roles/farmer/decisions`: Soil moisture, spray wash-off/drift risk, and farming windows.
  - `GET /api/roles/fisher/decisions`: Hydrodynamic wave/swell conditions, safe sailing clearance, and return-time deadline.
  - `GET /api/roles/aviation/briefing`: 3-hour conversational flight briefing, runway crosswind vectors, and METAR decoding.
  - `GET /api/roles/aviation/compare`: Dual airport weather comparison and enroute risk rating.
- [x] **Router Wiring ([`backend/app/api/routes/router.py`](file:///d:/My_Space/newWeatherGPT/backend/app/api/routes/router.py)):**
  - Registered `roles.router` under `/api/roles` with tag `"Role Decision Intelligence"`.
- [x] **Automated Verification ([`backend/tests/test_roles_phase1.py`](file:///d:/My_Space/newWeatherGPT/backend/tests/test_roles_phase1.py)):**
  - All 5 endpoints executed against FastAPI application and live weather feeds — all passed with HTTP 200 OK.

---

### Phase 2: 🌾 Farmer Intelligence Engine & "My Farm" Dashboard (🟢 COMPLETED)

- [x] **Backend Agronomic Decision Engine ([`backend/app/services/agri_weather_service.py`](file:///d:/My_Space/newWeatherGPT/backend/app/services/agri_weather_service.py)):**
  - `evaluate_soil_state`: Extracts surface (0-7cm) vs root zone (7-28cm) moisture, FAO-56 $\text{ET}_0$ evapotranspiration, deficit/saturation states, and irrigation urgency.
  - `calculate_farming_windows`: Computes hourly suitability scores (0-100) and limiting factors for Spraying, Irrigation, and Harvesting.
  - `evaluate_spraying_risk`: Evaluates wash-off risk ($\le 4\text{ h}$ post-spray rain risk) and wind drift risk ($>12\text{ km/h}$) with rainfast adjuvant recommendations.
  - `calculate_disease_propensity`: Agronomic pest/disease infection models for Soybean, Cotton, Wheat, Rice, Sugarcane, and Groundnut with actionable IPM recommendations.
  - `generate_farmer_decision`: End-to-end synthesis returning grounded `FarmerDecisionData` with Marathi/English advisories.
- [x] **Full Conversational Agent ([`backend/app/agents/farmer_agent.py`](file:///d:/My_Space/newWeatherGPT/backend/app/agents/farmer_agent.py)):**
  - Upgraded from stub to full `FarmerAgent(RoleAgent)` registered in `role_router`.
  - Injected verified agricultural telemetry context to prevent LLM hallucinations.
- [x] **Frontend TypeScript Contracts & Service ([`frontend/src/types/farmerIntelligence.ts`](file:///d:/My_Space/newWeatherGPT/frontend/src/types/farmerIntelligence.ts), [`frontend/src/services/farmerIntelligenceService.ts`](file:///d:/My_Space/newWeatherGPT/frontend/src/services/farmerIntelligenceService.ts)):**
  - API client fetching `/api/roles/farmer/decisions` with live query parameters and graceful fallback.
- [x] **Frontend `🌾 MY FARM` Dashboard Components:**
  - [`CropStageSelector.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/farmer/CropStageSelector.tsx): Interactive crop and growth stage selector with Marathi nomenclature.
  - [`FarmingWindowsTimeline.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/farmer/FarmingWindowsTimeline.tsx): Color-coded hourly suitability timeline for field operations.
  - [`SprayingRiskCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/farmer/SprayingRiskCard.tsx): Wash-off vs. wind drift meter with Go / Caution / No-Go hero badge.
  - [`SoilMoistureGauge.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/farmer/SoilMoistureGauge.tsx): Dual depth moisture gauges with $\text{ET}_0$ rate and irrigation urgency pill.
  - [`PestDiseaseRiskCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/farmer/PestDiseaseRiskCard.tsx): Weather-triggered pest warning cards with IPM chemical and bio remedies.
  - [`VernacularVoiceButton.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/farmer/VernacularVoiceButton.tsx): 1-tap Marathi / Hindi / English voice playback with transcript drawer.
  - [`FarmerDashboardPage.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/pages/FarmerDashboardPage.tsx): Complete dedicated decision dashboard for farmers.
- [x] **Navigation Wiring ([`frontend/src/App.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/App.tsx), [`frontend/src/components/dashboard/RoleBasedAdvisoryCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/dashboard/RoleBasedAdvisoryCard.tsx), [`frontend/src/context/UIContext.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/context/UIContext.tsx)):**
  - Selecting `Farmer` in role selector or navigating to `farmer` tab immediately loads `FarmerDashboardPage`.
- [x] **Automated Test Suite ([`backend/tests/test_roles_phase2.py`](file:///d:/My_Space/newWeatherGPT/backend/tests/test_roles_phase2.py)):**
  - All unit tests and multi-crop REST API checks executed and verified passing (HTTP 200 OK).

---

### Phase 3: 🎣 Marine Intelligence Engine & "My Sea" Dashboard (🟢 COMPLETED)

- [x] **Backend Hydrodynamic Decision Engine ([`backend/app/services/marine_weather_service.py`](file:///d:/My_Space/newWeatherGPT/backend/app/services/marine_weather_service.py)):**
  - `evaluate_sailing_clearance`: Evaluates wave heights ($<1.4\text{m}$, $1.4-2.5\text{m}$, $>2.5\text{m}$), wind velocity, and swell dynamics to generate Go / Caution / No-Sail status.
  - `calculate_return_time`: Scans the deterioration curve across the day to pinpoint the exact return cutoff hour, safe fishing duration, and deterioration reasons.
  - `compute_tide_extrema`: Semi-diurnal high/low tide calculation with harmonic approximations for West Coast (macro-tidal) vs East Coast (micro-tidal) Indian coastal ports.
  - `evaluate_zone_risks`: 3-tier risk model for Near-Shore ($0-5\text{ nm}$), Coastal ($5-20\text{ nm}$), and Deep-Sea ($>20\text{ nm}$) fishing vessels.
  - `get_beaufort_scale`: Maps wind speed in knots to 12-point Beaufort force scale with Marathi descriptors.
  - `generate_marine_decision`: End-to-end synthesis returning grounded `MarineDecisionData` with Marathi/Tamil/Hindi regional audio text.
- [x] **REST API Refactoring ([`backend/app/api/routes/roles.py`](file:///d:/My_Space/newWeatherGPT/backend/app/api/routes/roles.py)):**
  - Updated `/api/roles/fisher/decisions` to call `marine_weather_service.generate_marine_decision` directly.
- [x] **Full Conversational Agent ([`backend/app/agents/fisherman_agent.py`](file:///d:/My_Space/newWeatherGPT/backend/app/agents/fisherman_agent.py)):**
  - Upgraded stub to full `FishermanAgent(RoleAgent)` registered in `role_router` under `"fisher"` and `"fisherman"`.
  - Injected verified marine hydrodynamic context to prevent LLM hallucinations.
  - Replaced stub in [`backend/app/agents/role_agents.py`](file:///d:/My_Space/newWeatherGPT/backend/app/agents/role_agents.py).
- [x] **Frontend TypeScript Contracts & Service ([`frontend/src/types/fisherIntelligence.ts`](file:///d:/My_Space/newWeatherGPT/frontend/src/types/fisherIntelligence.ts), [`frontend/src/services/fisherIntelligenceService.ts`](file:///d:/My_Space/newWeatherGPT/frontend/src/services/fisherIntelligenceService.ts)):**
  - API client querying `/api/roles/fisher/decisions` with live departure time parameters and grounded fallback data.
- [x] **Frontend `🎣 MY SEA` Dashboard Components:**
  - [`SailingDecisionGauge.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/fisher/SailingDecisionGauge.tsx): Hero decision gauge (🟢 Safe to Sail / 🟡 Caution / 🔴 No Departure) with wave height, wind, and squall indicators.
  - [`ReturnTimeTimeline.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/fisher/ReturnTimeTimeline.tsx): Deterioration curve timeline showing departure $\rightarrow$ safe window $\rightarrow$ return cutoff.
  - [`SeaStateCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/fisher/SeaStateCard.tsx): Hydrodynamic telemetry card (Significant Wave $H_s$, Swell Height & Period, Sea Temp, Ocean Drift Currents, Beaufort Scale).
  - [`TideScheduleCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/fisher/TideScheduleCard.tsx): Semi-diurnal high and low tide schedule with height markers in meters.
  - [`ZoneRiskCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/fisher/ZoneRiskCard.tsx): 3-tier coastal zone matrix (Near-Shore $0-5\text{ nm}$, Coastal $5-20\text{ nm}$, Deep-Sea $>20\text{ nm}$).
  - [`MarineEmergencyCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/fisher/MarineEmergencyCard.tsx): Indian Coast Guard SOS (1554), Marine Police (1093), VHF Ch 16, and cyclone bulletin.
  - [`VernacularMarineVoiceButton.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/fisher/VernacularMarineVoiceButton.tsx): 1-tap coastal vernacular audio playback (Marathi / Tamil / Hindi / English).
  - [`FisherDashboardPage.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/pages/FisherDashboardPage.tsx): Dedicated decision dashboard for fishermen featuring harbor selector (Sassoon Docks, Versova, Ratnagiri, Malpe, Kochi, Chennai, Vizag, Porbandar, Paradip), departure time selector, and interactive Marine Q&A Chat.
- [x] **Navigation Wiring ([`frontend/src/App.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/App.tsx), [`frontend/src/components/dashboard/RoleBasedAdvisoryCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/dashboard/RoleBasedAdvisoryCard.tsx)):**
  - Selecting `Fisher` in role selector or navigating to `fisher` tab immediately loads `FisherDashboardPage`.
- [x] **Automated Test Suite ([`backend/tests/test_roles_phase3.py`](file:///d:/My_Space/newWeatherGPT/backend/tests/test_roles_phase3.py)):**
  - Suite prepared for sailing clearance boundaries, return-time cutoffs, tide calculation, agent registration, and REST API across Indian harbors.

---

### Phase 4: ✈️ Aviation Meteorological Engine & "My Operations" Dashboard (🟢 COMPLETED)

- [x] **Backend Aviation Decision Engine ([`backend/app/services/aviation_weather_service.py`](file:///d:/My_Space/newWeatherGPT/backend/app/services/aviation_weather_service.py)):**
  - `resolve_runway_winds`: Exact trigonometric crosswind & headwind component calculator across $360^\circ$ ($V_{\text{wind}}\sin\Delta\theta$ / $V_{\text{wind}}\cos\Delta\theta$) with left/right direction tags and operational statuses (normal $\le 15\text{ kts}$, caution $15\text{–}25\text{ kts}$, exceeded $>25\text{ kts}$).
  - `evaluate_flight_rules`: Flight category classifier for VFR ($\text{Ceiling} \ge 3000\text{ ft}, \text{Vis} \ge 5000\text{ m}$), MVFR ($\text{Ceiling} \ge 1000\text{ ft}, \text{Vis} \ge 3000\text{ m}$), IFR ($\text{Ceiling} \ge 500\text{ ft}, \text{Vis} \ge 1000\text{ m}$), and LVP ($< 500\text{ ft}$ or $< 1000\text{ m}$).
  - `decode_metar_taf`: Synthesizes standard ICAO METAR and TAF strings and produces tokenized explanations with hazard flags.
  - `generate_aviation_briefing`: End-to-end synthesis for Indian international airports (VABB, VIDP, VOBL, VOMM, VAPO, VOHS, VECC, VOCI, VAAH, VOGO) with auto-active runway resolution and Period Requiring Attention alerts.
  - `compare_airports`: Dual airport comparison engine evaluating landing suitability, crosswinds, and enroute hazards.
- [x] **REST API Refactoring ([`backend/app/api/routes/roles.py`](file:///d:/My_Space/newWeatherGPT/backend/app/api/routes/roles.py)):**
  - Refactored `/api/roles/airports`, `/api/roles/aviation/briefing`, and `/api/roles/aviation/compare` to delegate to `aviation_weather_service`.
- [x] **Full Conversational Agent ([`backend/app/agents/aviation_agent.py`](file:///d:/My_Space/newWeatherGPT/backend/app/agents/aviation_agent.py)):**
  - Upgraded stub to full `AviationAgent(RoleAgent)` registered in `role_router` under `"aviation"`, `"pilot"`, and `"dispatcher"`.
  - Injected verified aerodrome runway geometry, crosswinds, flight rules, CAPE storm metrics, and METAR decoding into LLM context.
  - Exported in [`backend/app/agents/role_agents.py`](file:///d:/My_Space/newWeatherGPT/backend/app/agents/role_agents.py).
- [x] **Frontend TypeScript Contracts & Service ([`frontend/src/types/aviationIntelligence.ts`](file:///d:/My_Space/newWeatherGPT/frontend/src/types/aviationIntelligence.ts), [`frontend/src/services/aviationIntelligenceService.ts`](file:///d:/My_Space/newWeatherGPT/frontend/src/services/aviationIntelligenceService.ts)):**
  - API client for querying `/api/roles/airports`, `/api/roles/aviation/briefing`, and `/api/roles/aviation/compare` with grounded offline fallback models.
- [x] **Frontend `✈️ MY OPERATIONS` Dashboard Components:**
  - [`AirportSelector.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/aviation/AirportSelector.tsx): Searchable Indian airport catalog with ICAO/IATA tags, elevation in ft MSL, and interactive runway switcher chips.
  - [`FlightCategoryBadge.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/aviation/FlightCategoryBadge.tsx): Hero flight rule badge (🟢 VFR / 🟡 MVFR / 🔴 IFR / 🟣 LVP) with estimated ceiling in ft AGL and prevailing visibility in meters.
  - [`RunwayCrosswindDial.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/aviation/RunwayCrosswindDial.tsx): Visual compass rose dial displaying magnetic runway centerline, aircraft vector, wind direction arrow, crosswind magnitude (kts left/right), headwind/tailwind, and caution/exceeded limits.
  - [`ConversationalBriefingCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/aviation/ConversationalBriefingCard.tsx): 3-hour executive flight brief, "Period Requiring Attention" operational hazard banner, and atmospheric telemetry (Temp/Dewpoint spread, QNH, CAPE storm index).
  - [`MetarTafDecoder.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/aviation/MetarTafDecoder.tsx): Raw ICAO METAR/TAF terminal box with toggleable plain-English synthesis and interactive token category highlights.
  - [`AirportComparisonModal.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/roles/aviation/AirportComparisonModal.tsx): Dual airport comparator (Origin vs Destination) with enroute risk assessment and favorable aerodrome recommendation.
  - [`AviationDashboardPage.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/pages/AviationDashboardPage.tsx): Dedicated master dashboard for aviation operations with interactive Flight Ops Q&A Chat.
- [x] **Navigation Wiring ([`frontend/src/App.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/App.tsx), [`frontend/src/components/dashboard/RoleBasedAdvisoryCard.tsx`](file:///d:/My_Space/newWeatherGPT/frontend/src/components/dashboard/RoleBasedAdvisoryCard.tsx)):**
  - Selecting `Aviation` in the role selector or navigating to `aviation` tab renders `AviationDashboardPage`.
- [x] **Automated Test Suite ([`backend/tests/test_roles_phase4.py`](file:///d:/My_Space/newWeatherGPT/backend/tests/test_roles_phase4.py)):**
  - Complete test suite created covering crosswind trigonometry across $360^\circ$, exceedance limits, flight categories, METAR decoding, agent resolution, and REST API endpoints.

---

### Phase 5: Multi-Agent Orchestration & Conversational Binding (🟢 COMPLETED)

- [x] **Unified Multi-Role Router Engine ([`backend/app/agents/role_router.py`](file:///d:/My_Space/newWeatherGPT/backend/app/agents/role_router.py)):**
  - Upgraded `RoleRouter` to dynamically load and register full domain agents (`FarmerAgent`, `FishermanAgent`, `AviationAgent`, `CitizenAgent`).
  - Added comprehensive alias mappings (`farmer`/`agriculture`/`farm`/`krishi`, `fisher`/`fisherman`/`marine`/`sea`, `aviation`/`pilot`/`flight`/`dispatcher`, `citizen`/`general`).
  - Added helper methods `list_roles()` and `is_role_supported()`.
- [x] **Domain-Specific Intent Classification Engine ([`backend/app/agents/intent_agent.py`](file:///d:/My_Space/newWeatherGPT/backend/app/agents/intent_agent.py)):**
  - Added multi-role intent classification for agricultural decisions (`AGRI_SPRAY_RISK`, `AGRI_IRRIGATION`, `AGRI_PEST_RISK`, `FARMING_WINDOWS`, `FARMING_DECISION`).
  - Added marine decision intents (`MARINE_SAIL_DECISION`, `MARINE_RETURN_TIME`, `MARINE_TIDE_SCHEDULE`, `MARINE_ZONE_RISK`).
  - Added aviation operations intents (`AVIATION_BRIEFING`, `RUNWAY_CROSSWIND`, `METAR_TAF_DECODE`, `AIRPORT_COMPARISON`).
  - Added entity extractors for crop types (Soybean, Cotton, Wheat, Rice, Sugarcane, Groundnut), coastal fishing harbors (Sassoon Docks, Versova, Ratnagiri, Malpe, Kochi, Chennai, Vizag, Porbandar, Paradip), and airport ICAOs/runways (VABB, VIDP, VOBL, VOMM, VAPO, etc.).
- [x] **Role-Aware Conversational Orchestrator ([`backend/app/agents/orchestrator_agent.py`](file:///d:/My_Space/newWeatherGPT/backend/app/agents/orchestrator_agent.py)):**
  - Integrated role-aware geolocation overrides for Indian airports and coastal harbors.
  - Implemented dynamic persona dispatching (`intent_res.detected_role` fallback when user is on generic persona).
  - Wired interactive role-specific quick action buttons into conversational response (`🌾 Open My Farm`, `🧪 Check Spraying Window`, `🎣 Open My Sea`, `⏱️ Check Return Deadline`, `✈️ Open Flight Ops`, `💨 Runway Crosswind`).
  - Enriched response metadata with `role.requested`, `role.detected`, `role.effective`, and `role.agent_name`.
- [x] **BHASHINI Vernacular Voice Pipeline ([`backend/app/services/bhashini_service.py`](file:///d:/My_Space/newWeatherGPT/backend/app/services/bhashini_service.py), [`backend/app/api/routes/bhashini.py`](file:///d:/My_Space/newWeatherGPT/backend/app/api/routes/bhashini.py), [`backend/app/api/routes/voice.py`](file:///d:/My_Space/newWeatherGPT/backend/app/api/routes/voice.py), [`frontend/src/hooks/useVoice.ts`](file:///d:/My_Space/newWeatherGPT/frontend/src/hooks/useVoice.ts)):**
  - Standardized TTS audio payload encoding across `/api/voice/synthesize` and `/api/bhashini/tts`.
  - Connected `useVoice.ts` hook directly to backend BHASHINI TTS with browser speech synthesis fallback.
  - Verified regional audio playback across Marathi (`mr`), Hindi (`hi`), Tamil (`ta`), and English (`en`).
- [x] **Automated Test Suite ([`backend/tests/test_roles_phase5.py`](file:///d:/My_Space/newWeatherGPT/backend/tests/test_roles_phase5.py)):**
  - Created end-to-end test suite testing intent classification, alias resolution, orchestrator execution, BHASHINI language detection & synthesis, and multi-role API chat switching.

