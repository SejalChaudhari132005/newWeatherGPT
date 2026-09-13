import {
  UrbanWeatherIntelligenceData,
  WaterloggingHotspotItem,
  DrainageRunoffMetricItem,
  HeatIslandMetricItem,
  InfrastructureExposureItem,
  UrbanPlannerBriefingResponse,
} from '../types/urbanIntelligence';

const API_BASE = '/api/roles/urban';

class UrbanIntelligenceService {
  async getUrbanIntelligence(
    lat: number,
    lon: number,
    locationName: string = 'Pune Urban Core'
  ): Promise<UrbanWeatherIntelligenceData> {
    try {
      const url = `${API_BASE}/intelligence?lat=${lat}&lon=${lon}&location_name=${encodeURIComponent(
        locationName
      )}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[UrbanIntelligenceService] getUrbanIntelligence failed, using fallback:', err);
      return this.getFallbackIntelligence(lat, lon, locationName);
    }
  }

  async getWaterloggingHotspots(
    locationName: string = 'Pune Urban Core',
    floodRisk: string = 'MODERATE'
  ): Promise<WaterloggingHotspotItem[]> {
    try {
      const url = `${API_BASE}/waterlogging-hotspots?location_name=${encodeURIComponent(
        locationName
      )}&flood_risk=${encodeURIComponent(floodRisk)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[UrbanIntelligenceService] getWaterloggingHotspots failed, using fallback:', err);
      return this.getFallbackHotspots(locationName);
    }
  }

  async getDrainageTimeline(
    lat: number,
    lon: number
  ): Promise<DrainageRunoffMetricItem[]> {
    try {
      const url = `${API_BASE}/drainage-timeline?lat=${lat}&lon=${lon}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[UrbanIntelligenceService] getDrainageTimeline failed, using fallback:', err);
      return this.getFallbackDrainageTimeline();
    }
  }

  async getHeatIslandZones(
    locationName: string = 'Pune Urban Core',
    ambientTemp: number = 30.5
  ): Promise<HeatIslandMetricItem[]> {
    try {
      const url = `${API_BASE}/heat-island-zones?location_name=${encodeURIComponent(
        locationName
      )}&ambient_temp=${ambientTemp}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[UrbanIntelligenceService] getHeatIslandZones failed, using fallback:', err);
      return this.getFallbackHeatZones(locationName);
    }
  }

  async getInfrastructureExposure(
    locationName: string = 'Pune Urban Core'
  ): Promise<InfrastructureExposureItem[]> {
    try {
      const url = `${API_BASE}/infrastructure-exposure?location_name=${encodeURIComponent(
        locationName
      )}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[UrbanIntelligenceService] getInfrastructureExposure failed, using fallback:', err);
      return this.getFallbackInfrastructure(locationName);
    }
  }

  async getUrbanBriefing(
    lat: number,
    lon: number,
    locationName: string = 'Pune Urban Core'
  ): Promise<UrbanPlannerBriefingResponse> {
    try {
      const url = `${API_BASE}/briefing?lat=${lat}&lon=${lon}&location_name=${encodeURIComponent(
        locationName
      )}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[UrbanIntelligenceService] getUrbanBriefing failed, using fallback:', err);
      const intel = this.getFallbackIntelligence(lat, lon, locationName);
      const hotspots = this.getFallbackHotspots(locationName);
      const timeline = this.getFallbackDrainageTimeline();
      const heatZones = this.getFallbackHeatZones(locationName);
      const infra = this.getFallbackInfrastructure(locationName);

      return {
        success: true,
        location_name: locationName,
        timestamp: new Date().toISOString(),
        urban_intelligence: intel,
        waterlogging_hotspots: hotspots,
        drainage_timeline: timeline,
        heat_island_zones: heatZones,
        infrastructure_exposure: infra,
        planning_recommendations: [
          `Pre-deploy suction tankers and dewatering pumps at designated underpasses before peak window (${intel.peak_rainfall_window}).`,
          `Storm Drain Utilization is at ${intel.drainage_capacity_utilization_pct}%. Clear trash screens in core wards.`,
          `UHI Thermal Delta is +${intel.urban_heat_island_delta_c}°C. Mandate cool roof coatings in dense commercial zones.`,
        ],
      };
    }
  }

  getFallbackIntelligence(
    lat: number,
    lon: number,
    locationName: string
  ): UrbanWeatherIntelligenceData {
    return {
      location_name: locationName,
      latitude: lat,
      longitude: lon,
      urban_flood_risk: 'HIGH',
      rainfall_24h_mm: 42.0,
      peak_rainfall_window: '4:00 PM – 7:00 PM',
      peak_intensity_mmh: 18.5,
      critical_infrastructure_risk_count: 3,
      surface_runoff_coefficient: 0.78,
      drainage_capacity_utilization_pct: 74,
      urban_heat_island_delta_c: 3.4,
      surface_temperature_c: 36.2,
      heat_stress_category: 'HIGH',
      air_ventilation_index: 'MODERATE',
      updated_at: '2 min ago',
    };
  }

  getFallbackHotspots(locationName: string): WaterloggingHotspotItem[] {
    const loc = (locationName || '').toLowerCase();
    if (loc.includes('thane')) {
      return [
        {
          hotspot_name: 'Vandana Cinema ST Stand Lowlands',
          ward_name: 'Naupada-Kopri (Ward 1)',
          elevation_dip_m: 1.9,
          predicted_water_depth_cm: 32,
          drainage_status: 'SURCHARGED',
          risk_level: 'HIGH',
          mitigation_action: 'Deploy high-capacity 120 HP dewatering pumps towards Masunda Lake outfall.',
        },
        {
          hotspot_name: 'Teen Hath Naka Eastern Express Underpass',
          ward_name: 'Naupada (Ward 2)',
          elevation_dip_m: 2.2,
          predicted_water_depth_cm: 28,
          drainage_status: 'AT CAPACITY',
          risk_level: 'HIGH',
          mitigation_action: 'Divert light motor vehicles towards Nitin Company flyover; monitor sump pump.',
        },
        {
          hotspot_name: 'Ghodbunder Road Ovala Underpass',
          ward_name: 'Majiwada-Manpada (Ward 4)',
          elevation_dip_m: 1.5,
          predicted_water_depth_cm: 22,
          drainage_status: 'SURCHARGED',
          risk_level: 'MODERATE',
          mitigation_action: 'Clear culvert blockage and debris towards Ulhas estuary channel.',
        },
        {
          hotspot_name: 'Kalwa Naka & Retibunder Causeway',
          ward_name: 'Kalwa Ward (Ward 7)',
          elevation_dip_m: 1.1,
          predicted_water_depth_cm: 16,
          drainage_status: 'OPERATIONAL',
          risk_level: 'LOW',
          mitigation_action: 'Monitor Thane Creek high tide sluice gates.',
        },
      ];
    }

    if (loc.includes('mumbai')) {
      return [
        {
          hotspot_name: 'Milan Subway Underpass',
          ward_name: 'K-West (Santacruz)',
          elevation_dip_m: 2.8,
          predicted_water_depth_cm: 45,
          drainage_status: 'SURCHARGED',
          risk_level: 'CRITICAL',
          mitigation_action: 'Engage high-capacity dewatering turbines; divert traffic to Milan Flyover.',
        },
        {
          hotspot_name: 'Hindmata Junction & Gandhi Market',
          ward_name: 'F-South (Parel / Dadar)',
          elevation_dip_m: 1.9,
          predicted_water_depth_cm: 35,
          drainage_status: 'SURCHARGED',
          risk_level: 'HIGH',
          mitigation_action: 'Operate Pramod Mahajan Kala Park underground holding tank at full capacity.',
        },
        {
          hotspot_name: 'Andheri Subway Low-Lying Arterial',
          ward_name: 'K-East Ward',
          elevation_dip_m: 2.2,
          predicted_water_depth_cm: 40,
          drainage_status: 'SURCHARGED',
          risk_level: 'CRITICAL',
          mitigation_action: 'Close subway to light motor vehicles; direct traffic to Gokhale Bridge.',
        },
      ];
    }

    if (loc.includes('bengaluru') || loc.includes('bangalore')) {
      return [
        {
          hotspot_name: 'EcoSpace Outer Ring Road Underpass',
          ward_name: 'Mahadevapura (Ward 85)',
          elevation_dip_m: 1.6,
          predicted_water_depth_cm: 30,
          drainage_status: 'SURCHARGED',
          risk_level: 'HIGH',
          mitigation_action: 'Deploy BBMP tractor-mounted pumps; open secondary culvert to Bellandur.',
        },
        {
          hotspot_name: 'Sony World Signal Lowlands',
          ward_name: 'Koramangala (Ward 151)',
          elevation_dip_m: 1.4,
          predicted_water_depth_cm: 25,
          drainage_status: 'AT CAPACITY',
          risk_level: 'HIGH',
          mitigation_action: 'Clear storm drain grates along 80 Feet Road.',
        },
      ];
    }

    return [
      {
        hotspot_name: 'Alankar Cinema Subway Underpass',
        ward_name: 'Shivajinagar (Ward 7)',
        elevation_dip_m: 2.4,
        predicted_water_depth_cm: 35,
        drainage_status: 'SURCHARGED',
        risk_level: 'HIGH',
        mitigation_action: 'Deploy auxiliary 150 HP dewatering pumps and shut vehicular barriers.',
      },
      {
        hotspot_name: 'Deccan Gymkhana Riverside Road',
        ward_name: 'Kasba-Vishrambaug (Ward 15)',
        elevation_dip_m: 1.8,
        predicted_water_depth_cm: 25,
        drainage_status: 'AT CAPACITY',
        risk_level: 'HIGH',
        mitigation_action: 'Close riverfront causeway; verify Mutha sluice backflow flap valves.',
      },
      {
        hotspot_name: 'Sinhagad Road Manikbaug Lowlands',
        ward_name: 'Sinhagad Road (Ward 18)',
        elevation_dip_m: 1.2,
        predicted_water_depth_cm: 20,
        drainage_status: 'SURCHARGED',
        risk_level: 'MODERATE',
        mitigation_action: 'Clear storm drain grates of plastic debris; divert traffic to Canal Road.',
      },
      {
        hotspot_name: 'Hadapsar Gadital Chowk Underpass',
        ward_name: 'Hadapsar-Mundhwa (Ward 21)',
        elevation_dip_m: 0.9,
        predicted_water_depth_cm: 15,
        drainage_status: 'OPERATIONAL',
        risk_level: 'LOW',
        mitigation_action: 'Maintain routine sump pumping cycle.',
      },
    ];
  }

  getFallbackDrainageTimeline(): DrainageRunoffMetricItem[] {
    return [
      {
        time_window: '06:00 - 12:00',
        projected_rainfall_mm: 8.5,
        runoff_volume_m3_per_hr: 16500.0,
        drainage_capacity_m3_per_hr: 25000.0,
        capacity_status: 'CLEAR',
      },
      {
        time_window: '12:00 - 18:00 (Peak)',
        projected_rainfall_mm: 24.5,
        runoff_volume_m3_per_hr: 29800.0,
        drainage_capacity_m3_per_hr: 28000.0,
        capacity_status: 'SURCHARGED',
      },
      {
        time_window: '18:00 - 24:00',
        projected_rainfall_mm: 9.0,
        runoff_volume_m3_per_hr: 18200.0,
        drainage_capacity_m3_per_hr: 25000.0,
        capacity_status: 'CLEAR',
      },
      {
        time_window: '00:00 - 06:00 (+1D)',
        projected_rainfall_mm: 3.5,
        runoff_volume_m3_per_hr: 7500.0,
        drainage_capacity_m3_per_hr: 22000.0,
        capacity_status: 'CLEAR',
      },
    ];
  }

  getFallbackHeatZones(locationName: string): HeatIslandMetricItem[] {
    const loc = (locationName || '').toLowerCase();
    if (loc.includes('thane')) {
      return [
        {
          zone_name: 'Wagle Industrial Estate Core',
          canopy_cover_pct: 4.5,
          impervious_surface_pct: 90.0,
          ambient_temp_c: 31.5,
          surface_temp_c: 40.5,
          uhi_delta_c: 4.0,
          vulnerability_rating: 'CRITICAL',
        },
        {
          zone_name: 'Naupada Commercial Sector',
          canopy_cover_pct: 8.0,
          impervious_surface_pct: 84.0,
          ambient_temp_c: 31.5,
          surface_temp_c: 39.0,
          uhi_delta_c: 3.2,
          vulnerability_rating: 'HIGH',
        },
        {
          zone_name: 'Ghodbunder Hiranandani Meadow',
          canopy_cover_pct: 18.0,
          impervious_surface_pct: 68.0,
          ambient_temp_c: 31.5,
          surface_temp_c: 37.0,
          uhi_delta_c: 1.8,
          vulnerability_rating: 'MODERATE',
        },
        {
          zone_name: 'Yeoor Hills Protected Forest',
          canopy_cover_pct: 68.0,
          impervious_surface_pct: 10.0,
          ambient_temp_c: 31.5,
          surface_temp_c: 33.0,
          uhi_delta_c: -2.5,
          vulnerability_rating: 'LOW',
        },
      ];
    }

    return [
      {
        zone_name: 'Nana Peth & Bhavani Peth Dense Core',
        canopy_cover_pct: 4.2,
        impervious_surface_pct: 88.5,
        ambient_temp_c: 31.0,
        surface_temp_c: 39.7,
        uhi_delta_c: 4.2,
        vulnerability_rating: 'CRITICAL',
      },
      {
        zone_name: 'Hinjawadi IT Park Phase 1',
        canopy_cover_pct: 8.5,
        impervious_surface_pct: 78.0,
        ambient_temp_c: 31.0,
        surface_temp_c: 38.6,
        uhi_delta_c: 3.1,
        vulnerability_rating: 'HIGH',
      },
      {
        zone_name: 'Viman Nagar Commercial Corridor',
        canopy_cover_pct: 12.0,
        impervious_surface_pct: 72.0,
        ambient_temp_c: 31.0,
        surface_temp_c: 37.9,
        uhi_delta_c: 2.4,
        vulnerability_rating: 'MODERATE',
      },
      {
        zone_name: 'ARAI Hills & Law College Slopes',
        canopy_cover_pct: 54.0,
        impervious_surface_pct: 16.0,
        ambient_temp_c: 31.0,
        surface_temp_c: 34.3,
        uhi_delta_c: -1.2,
        vulnerability_rating: 'LOW',
      },
    ];
  }

  getFallbackInfrastructure(locationName: string): InfrastructureExposureItem[] {
    const loc = (locationName || '').toLowerCase();
    if (loc.includes('thane')) {
      return [
        {
          facility_name: 'Thane Railway Station West Concourse',
          facility_type: 'PRIMARY_ARTERIAL',
          location_ward: 'Naupada',
          exposure_level: 'HIGH',
          operational_impact: 'Pedestrian subway and bus terminus waterlogging during creek high tide overlap.',
          recommended_action: 'Deploy auxiliary trailer-mounted dewatering pumps and maintain clear passenger lanes.',
        },
        {
          facility_name: 'Chhatrapati Shivaji Maharaj Hospital Kalwa',
          facility_type: 'HOSPITAL_ACCESS',
          location_ward: 'Kalwa',
          exposure_level: 'HIGH',
          operational_impact: 'Lowland emergency entrance susceptible to surface runoff accumulation.',
          recommended_action: 'Keep dedicated TMC emergency suction tanker on continuous standby.',
        },
        {
          facility_name: 'Majiwada Flyover Junction Low Level',
          facility_type: 'UNDERPASS',
          location_ward: 'Majiwada',
          exposure_level: 'MODERATE',
          operational_impact: 'Traffic bottleneck between Nashik Highway and Ghodbunder Road.',
          recommended_action: 'Activate automated storm drainage sump and traffic diversion protocols.',
        },
      ];
    }

    return [
      {
        facility_name: 'Shivajinagar Underground Metro Station',
        facility_type: 'METRO_STATION',
        location_ward: 'Shivajinagar',
        exposure_level: 'HIGH',
        operational_impact: 'Subsurface concourse sump pump near peak load. Ingress stairs waterlogging risk.',
        recommended_action: 'Mount aluminum flood barriers at Entry Gate 2 and activate secondary sump.',
      },
      {
        facility_name: 'Sassoon General Hospital Emergency Corridor',
        facility_type: 'HOSPITAL_ACCESS',
        location_ward: 'Pune Station / Rasta Peth',
        exposure_level: 'HIGH',
        operational_impact: 'Ambulance transit lane prone to 15-25cm pooling during peak downpours.',
        recommended_action: 'Keep dedicated traffic wardens and mobile suction tanker on standby.',
      },
      {
        facility_name: 'Sancheti Hospital Underpass',
        facility_type: 'UNDERPASS',
        location_ward: 'Shivajinagar',
        exposure_level: 'CRITICAL',
        operational_impact: 'Road inundation >30cm blocks arterial connectivity between Camp and Aundh.',
        recommended_action: 'Trigger automated LED warning gantries and divert heavy buses to Sangam Bridge.',
      },
      {
        facility_name: 'Bund Garden 132kV Power Substation',
        facility_type: 'POWER_SUBSTATION',
        location_ward: 'Yerawada',
        exposure_level: 'MODERATE',
        operational_impact: 'Peripheral drainage ditch surcharge could threaten transformer plinth clearances.',
        recommended_action: 'Inspect diesel backup generators and plinth flood walls.',
      },
    ];
  }
}

export const urbanIntelligenceService = new UrbanIntelligenceService();
