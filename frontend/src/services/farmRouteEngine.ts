/**
 * FarmRoute Agricultural Planning & Advisory Engine
 * Generates weather-optimized farm work timelines, suitability scores,
 * and decision comparisons based on real weather variables and crop profile.
 */

import { FarmProfile } from '../types/farm';
import { WeatherGPTResponse, WeatherHourlyItem } from '../types/weather';
import { CROP_PROFILES, getCropProfile } from '../utils/cropProfiles';
import { LanguageCode } from '../context/LanguageContext';

export interface FarmActivityItem {
  id: string;
  timeWindow: string;
  activityName: string;
  localizedActivityName?: Record<LanguageCode, string>;
  category: 'spraying' | 'inspection' | 'heat_warning' | 'irrigation' | 'rain_warning' | 'harvesting' | 'fertilizer';
  statusBadge: string;
  localizedStatusBadge?: Record<LanguageCode, string>;
  statusType: 'excellent' | 'good' | 'warning' | 'rain' | 'caution';
  suitabilityScore: number | null; // 0-100 or null for warnings
  summaryReason: string;
  localizedSummaryReason?: Record<LanguageCode, string>;
  whyPoints: string[];
  localizedWhyPoints?: Record<LanguageCode, string[]>;
  avoidAfter?: string;
  avoidReason?: string;
  iconName: 'spray' | 'tractor' | 'sun' | 'water' | 'cloud-rain' | 'wheat' | 'sprout';
}

export interface OptionComparison {
  id: string;
  title: string;
  localizedTitle?: Record<LanguageCode, string>;
  subtitle?: string;
  optionA: {
    title: string;
    badge?: string;
    points: string[];
    isRecommended: boolean;
  };
  optionB: {
    title: string;
    badge?: string;
    points: string[];
    isRecommended: boolean;
  };
}

export interface FarmRoutePlan {
  overallScore: number;
  overallRating: string;
  factors: {
    rain: 'Good' | 'Moderate' | 'High Risk';
    wind: 'Good' | 'Moderate' | 'High Risk';
    temperature: 'Good' | 'Moderate' | 'High Heat';
    water: 'Good' | 'Moderate' | 'Low';
  };
  activities: FarmActivityItem[];
  comparisons: OptionComparison[];
  generatedAt: string;
}

export class FarmRouteEngine {
  /**
   * Generates a dynamic farm timeline from real weather and farm profile.
   */
  public generatePlan(params: {
    farm: FarmProfile | null;
    weather: WeatherGPTResponse | null;
    language?: LanguageCode;
  }): FarmRoutePlan {
    const { farm, weather } = params;
    const current = weather?.current;
    const hourly = weather?.hourly || [];
    const daily = weather?.daily || [];

    const cropId = farm?.primary_crop || 'rice';
    const growthStage = farm?.growth_stage || 'pod_filling';
    const cropProfile = getCropProfile(cropId);

    const temp = current?.temperature ?? 27;
    const humidity = current?.humidity ?? 75;
    const windSpeed = current?.wind_speed ?? 6;
    const rainProb = current?.rain_probability ?? 10;
    const precipitation = current?.precipitation ?? 0;

    // Calculate dynamic activity scores
    // 1. Spraying Suitability Score (0-100)
    let sprayScore = 95;
    if (windSpeed > 15) sprayScore -= 40;
    else if (windSpeed > 10) sprayScore -= 18;
    if (rainProb > 50) sprayScore -= 50;
    else if (rainProb > 25) sprayScore -= 25;
    if (temp > 33) sprayScore -= 20;
    else if (temp < 18) sprayScore -= 15;
    if (humidity > 85) sprayScore -= 10;
    sprayScore = Math.max(15, Math.min(98, Math.round(sprayScore)));

    // 2. Field Inspection Score (0-100)
    let inspectScore = 90;
    if (temp > 35) inspectScore -= 30;
    else if (temp > 30) inspectScore -= 12;
    if (precipitation > 2) inspectScore -= 35;
    inspectScore = Math.max(20, Math.min(95, Math.round(inspectScore)));

    // 3. Peak heat check
    const maxTempToday = Math.max(...hourly.slice(0, 16).map((h) => h.temp ?? 27), temp);
    const hasHighHeat = maxTempToday >= 33;

    // 4. Rain expected check
    const hasRainExpected = hourly.slice(0, 18).some((h) => (h.rainProb ?? 0) >= 55 || (h.precipitation ?? 0) > 1.0);
    const rainStartTime = hourly.find((h) => (h.rainProb ?? 0) >= 55)?.time || '03:00 PM';

    const isMatureCrop = growthStage.toLowerCase().includes('matur') || growthStage.toLowerCase().includes('harvest');

    const activities: FarmActivityItem[] = [];

    // --- Activity 1: Morning Spraying ---
    if (sprayScore >= 60) {
      activities.push({
        id: 'activity-spray',
        timeWindow: '06:30 – 09:30 AM',
        activityName: 'Spraying',
        localizedActivityName: {
          en: 'Spraying',
          mr: 'औषध फवारणी',
          hi: 'कीटनाशक छिड़काव',
          gu: 'છંટકાવ કામ',
          ta: 'தெளித்தல்',
          te: 'స్ప్రేయింగ్',
          kn: 'ಸಿಂಪರಣೆ',
          ml: 'തളിക്കൽ',
          bn: 'স্প্রে করা',
          pa: 'ਸਪਰੇਅ',
          or: 'ସ୍ପ୍ରେ କରିବା',
        },
        category: 'spraying',
        statusBadge: sprayScore >= 85 ? 'Excellent' : 'Good',
        localizedStatusBadge: {
          en: sprayScore >= 85 ? 'Excellent' : 'Good',
          mr: sprayScore >= 85 ? 'उत्तम' : 'चांगले',
          hi: sprayScore >= 85 ? 'उत्कृष्ट' : 'अच्छा',
          gu: 'ઉત્તમ',
          ta: 'சிறந்தது',
          te: 'ఉత్తమం',
          kn: 'ಉತ್ತಮ',
          ml: 'മികച്ചത്',
          bn: 'চমৎকার',
          pa: 'ਵਧੀਆ',
          or: 'ଉତ୍କୃଷ୍ଟ',
        },
        statusType: 'excellent',
        suitabilityScore: sprayScore,
        summaryReason: `Low wind (${windSpeed} km/h) • No immediate rain • Ideal temp (${temp}°C)`,
        localizedSummaryReason: {
          en: `Low wind (${windSpeed} km/h) • No immediate rain • Ideal temp (${temp}°C)`,
          mr: `कमी वारा (${windSpeed} km/h) • पावसाचा धोका नाही • अनुकूल तापमान (${temp}°C)`,
          hi: `कम हवा (${windSpeed} km/h) • बारिश का खतरा नहीं • अनुकूल तापमान (${temp}°C)`,
          gu: `ઓછો પવન • વરસાદની શક્યતા ઓછી • અનુકૂળ તાપમાન`,
          ta: `குறைந்த காற்று • மழை இல்லை • மிதமான வெப்பநிலை`,
          te: `తక్కువ గాలి • వర్షం లేదు • అనుకూల ఉష్ణోగ్రత`,
          kn: `ಕಡಿಮೆ ಗಾಳಿ • ಮಳೆಯಿಲ್ಲ • ಸೂಕ್ತ ತಾಪಮಾನ`,
          ml: `കുറഞ്ഞ കാറ്റ് • മഴയില്ല • അനുയോജ്യമായ താപനില`,
          bn: `কম বাতাস • বৃষ্টির ঝুঁকি নেই • উপযুক্ত তাপমাত্রা`,
          pa: `ਘੱਟ ਹਵਾ • ਮੀਂਹ ਨਹੀਂ • ਢੁਕਵਾਂ ਤਾਪਮਾਨ`,
          or: `କମ୍ ପବନ • ବର୍ଷା ବିପଦ ନାହିଁ • ଅନୁକୂଳ ତାପମାତ୍ରା`,
        },
        whyPoints: [
          `Wind speed is under ${cropProfile.maxWindForSprayKmh} km/h, preventing chemical drift`,
          'Zero wash-off risk in the upcoming 3 hours',
          `Temperature between ${cropProfile.optimalTempMin}°C - ${cropProfile.optimalTempMax}°C maximizes leaf absorption`,
        ],
        avoidAfter: '10:30 AM',
        avoidReason: 'Wind speed & solar evaporation rate expected to rise significantly.',
        iconName: 'spray',
      });
    }

    // --- Activity 2: Morning Field Inspection ---
    activities.push({
      id: 'activity-inspection',
      timeWindow: '10:00 AM – 12:00 PM',
      activityName: 'Field Inspection',
      localizedActivityName: {
        en: 'Field Inspection',
        mr: 'शेत पाहणी व तपासणी',
        hi: 'खेत निरीक्षण एवं निगरानी',
        gu: 'ખેતર નિરીક્ષણ',
        ta: 'வயல் ஆய்வு',
        te: 'క్షేత్ర తనిఖీ',
        kn: 'ಜಮೀನು ಪರಿಶೀಲನೆ',
        ml: 'കൃഷിയിട പരിശോധന',
        bn: 'মাঠ পরিদর্শন',
        pa: 'ਖੇਤ ਦਾ ਨਿਰੀਖਣ',
        or: 'କ୍ଷେତ ନିରୀକ୍ଷଣ',
      },
      category: 'inspection',
      statusBadge: 'Good',
      localizedStatusBadge: {
        en: 'Good',
        mr: 'चांगले',
        hi: 'अच्छा',
        gu: 'સારું',
        ta: 'நன்று',
        te: 'మంచిది',
        kn: 'ಉತ್ತಮ',
        ml: 'നല്ലത്',
        bn: 'ভালো',
        pa: 'ਚੰਗਾ',
        or: 'ଭଲ',
      },
      statusType: 'good',
      suitabilityScore: inspectScore,
      summaryReason: 'Comfortable temperature • Clear visibility for pest & weed check',
      localizedSummaryReason: {
        en: 'Comfortable temperature • Clear visibility for pest & weed check',
        mr: 'आल्हाददायक हवामान • कीड व तण तपासणीसाठी स्वच्छ प्रकाश',
        hi: 'सुखद तापमान • कीट एवं खरपतवार निरीक्षण के लिए स्पष्ट दृश्यता',
        gu: 'અનુકૂળ હવામાન • જીવાત તપાસવા યોગ્ય',
        ta: 'இதமான வெப்பநிலை • பூச்சி ஆய்வு செய்ய ஏற்றது',
        te: 'అనుకూల వాతావరణం • తెగుళ్ల పరిశీలనకు మంచిది',
        kn: 'ಉತ್ತಮ ವಾತಾವರಣ • ಕೀಟ ತಪಾಸಣೆಗೆ ಸೂಕ್ತ',
        ml: 'നല്ല കാലാവസ്ഥ • കീട നിരീക്ഷണത്തിന് ഉചിതം',
        bn: 'অনুকূল আবহাওয়া • পোকা পর্যবেক্ষণের উপযুক্ত',
        pa: 'ਵਧੀਆ ਤਾਪਮਾਨ • ਕੀੜੇ ਚੈੱਕ ਕਰਨ ਲਈ ਢੁਕਵਾਂ',
        or: 'ଅନୁକୂଳ ପାଗ • କୀଟ ନିରୀକ୍ଷଣ ପାଇଁ ଉପଯୁକ୍ତ',
      },
      whyPoints: [
        'Optimal ambient sunlight for examining leaf undersides and soil drainage',
        `Monitor ${cropProfile.name} at ${growthStage.replace(/_/g, ' ')} stage for localized pests`,
        'Soil firmness allows easy walking without compaction',
      ],
      iconName: 'tractor',
    });

    // --- Activity 3: Mid-Day Heat Management ---
    activities.push({
      id: 'activity-heat',
      timeWindow: '12:00 – 03:00 PM',
      activityName: hasHighHeat ? 'Avoid Field Work' : 'Light Shaded Work',
      localizedActivityName: {
        en: hasHighHeat ? 'Avoid Field Work' : 'Light Shaded Work',
        mr: hasHighHeat ? 'दुपारी शेतातील कामे टाळा' : 'सावलीजवळील हलकी कामे',
        hi: hasHighHeat ? 'दोपहर में खेत कार्य से बचें' : 'छायादार हल्के कार्य',
        gu: hasHighHeat ? 'બપોરે ખેતરનું કામ ટાળો' : 'હળવા કામ',
        ta: hasHighHeat ? 'நண்பகல் வேலை தவிர்க்கவும்' : 'நிழல் வேலை',
        te: hasHighHeat ? 'మధ్యాహ్నం పనులు వద్దు' : 'తేలికపాటి పనులు',
        kn: hasHighHeat ? 'ಮಧ್ಯಾಹ್ನ ಕೆಲಸ ತಪ್ಪಿಸಿ' : 'ನೆರಳಿನ ಕೆಲಸ',
        ml: hasHighHeat ? 'ഉച്ചയ്ക്ക് പണി ഒഴിവാക്കുക' : 'തണൽ പണികൾ',
        bn: hasHighHeat ? 'দুপুরে মাঠের কাজ এড়িয়ে চলুন' : 'হালকা কাজ',
        pa: hasHighHeat ? 'ਦੁਪਹਿਰ ਨੂੰ ਕੰਮ ਤੋਂ ਬਚੋ' : 'ਹਲਕੇ ਕੰਮ',
        or: hasHighHeat ? 'ମଧ୍ୟାହ୍ନ କାର୍ଯ୍ୟରୁ ଦୂରେଇ ରୁହନ୍ତୁ' : 'ହାଲୁକା କାର୍ଯ୍ୟ',
      },
      category: 'heat_warning',
      statusBadge: hasHighHeat ? 'High Heat' : 'Moderate',
      localizedStatusBadge: {
        en: hasHighHeat ? 'High Heat' : 'Moderate',
        mr: hasHighHeat ? 'जास्त उष्णता' : 'मध्यम',
        hi: hasHighHeat ? 'तीव्र गर्मी' : 'सामान्य',
        gu: 'વધારે ગરમી',
        ta: 'அதிக வெப்பம்',
        te: 'ఎక్కువ వేడి',
        kn: 'ಹೆಚ್ಚು ಬಿಸಿಲು',
        ml: 'കടുത്ത ചൂട്',
        bn: 'তীব্র তাপ',
        pa: 'ਤੇਜ਼ ਗਰਮੀ',
        or: 'ଅଧିକ ଖରା',
      },
      statusType: 'warning',
      suitabilityScore: null,
      summaryReason: hasHighHeat
        ? `Temperature expected peak (${Math.round(maxTempToday)}°C+). Prevent dehydration.`
        : 'High solar UV radiation during noon peak.',
      localizedSummaryReason: {
        en: hasHighHeat
          ? `Temperature expected peak (${Math.round(maxTempToday)}°C+). Prevent dehydration.`
          : 'High solar UV radiation during noon peak.',
        mr: `दुपारी तापमान जास्त (${Math.round(maxTempToday)}°C) राहण्याची शक्यता. डिहायड्रेशन टाळा.`,
        hi: `दोपहर में तापमान अधिक (${Math.round(maxTempToday)}°C) रहेगा। निर्जलीकरण से बचें।`,
        gu: `બપોરે તાપમાન વધારે રહેશે. સાવચેતી રાખો.`,
        ta: `வெப்பநிலை அதிகம் இருக்கும். நீர்ச்சத்து இழப்பை தவிர்க்கவும்.`,
        te: `ఉష్ణోగ్రత ఎక్కువగా ఉంటుంది. జాగ్రత్త వహించండి.`,
        kn: `ತಾಪಮಾನ ಹೆಚ್ಚಿರುತ್ತದೆ. ಮುನ್ನೆಚ್ಚರಿಕೆ ವಹಿಸಿ.`,
        ml: `ഉയർന്ന താപനില. നിർജ്ജലീകരണം ഒഴിവാക്കുക.`,
        bn: `তাপমাত্রা বেশি থাকবে। সতর্কতা অবলম্বন করুন।`,
        pa: `ਤਾਪਮਾਨ ਵੱਧ ਰਹੇਗਾ। ਸਾਵਧਾਨ ਰਹੋ।`,
        or: `ତାପମାତ୍ରା ଅଧିକ ରହିବ। ସତର୍କ ରୁହନ୍ତୁ।`,
      },
      whyPoints: [
        'High heat index increases physical exhaustion and heat stress',
        'Chemical spraying during mid-day causes chemical phytotoxicity and leaf burns',
        'High evapotranspiration rapidly evaporates applied foliar solutions',
      ],
      iconName: 'sun',
    });

    // --- Activity 4: Afternoon Irrigation Window ---
    if (hasRainExpected) {
      activities.push({
        id: 'activity-irrigation-skip',
        timeWindow: '03:00 – 06:00 PM',
        activityName: 'Do Not Irrigate',
        localizedActivityName: {
          en: 'Do Not Irrigate',
          mr: 'पाणी / सिंचन देणे टाळा',
          hi: 'सिंचाई न करें (वर्षा संभावना)',
          gu: 'સિંચાઈ ટાળો',
          ta: 'பாசனம் செய்ய வேண்டாம்',
          te: 'నీరు పెట్టవద్దు',
          kn: 'ನೀರಾವರಿ ಮಾಡಬೇಡಿ',
          ml: 'നനയ്ക്കരുത്',
          bn: 'সেচ দেবেন না',
          pa: 'ਸਿੰਚਾਈ ਨਾ ਕਰੋ',
          or: 'ଜଳସେଚନ କରନ୍ତୁ ନାହିଁ',
        },
        category: 'irrigation',
        statusBadge: 'Rain Expected',
        localizedStatusBadge: {
          en: 'Rain Expected',
          mr: 'पाऊस अपेक्षित',
          hi: 'बारिश संभावित',
          gu: 'વરસાદ સંભવ',
          ta: 'மழை வாய்ப்பு',
          te: 'వర్షం అవకాశం',
          kn: 'ಮಳೆ ನಿರೀಕ್ಷೆ',
          ml: 'മഴ സാധ്യത',
          bn: 'বৃষ্টির সম্ভাবনা',
          pa: 'ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ',
          or: 'ବର୍ଷା ସମ୍ଭାବନା',
        },
        statusType: 'rain',
        suitabilityScore: null,
        summaryReason: `Rain forecast in evening • Save water & prevent soil waterlogging`,
        localizedSummaryReason: {
          en: 'Rain forecast in evening • Save water & prevent soil waterlogging',
          mr: 'संध्याकाळी पावसाची शक्यता • पाणी वाचवा आणि दलदल टाळा',
          hi: 'शाम को बारिश की संभावना • पानी बचाएं और जलभराव रोकें',
          gu: 'સાંજે વરસાદની શક્યતા • પાણી બચાવો',
          ta: 'மாலையில் மழை வாய்ப்பு • நீர் சேமிக்கவும்',
          te: 'సాయంత్రం వర్షం రావచ్చు • నీటిని ఆదా చేయండి',
          kn: 'ಸಂಜೆ ಮಳೆ ಸಾಧ್ಯತೆ • ನೀರು ಉಳಿಸಿ',
          ml: 'വൈകുന്നേരം മഴ സാധ്യത • വെള്ളം ലാഭിക്കുക',
          bn: 'বিকালে বৃষ্টির সম্ভাবনা • পানি বাঁচান',
          pa: 'ਸ਼ਾਮ ਨੂੰ ਮੀਂਹ ਪੈ ਸਕਦਾ ਹੈ • ਪਾਣੀ ਬਚਾਓ',
          or: 'ସନ୍ଧ୍ୟାରେ ବର୍ଷା ସମ୍ଭାବନା • ପାଣି ବଞ୍ଚାନ୍ତୁ',
        },
        whyPoints: [
          'Natural precipitation will fulfill root zone moisture demands',
          'Prevents excess standing water that can lead to root rot in alluvial/clay soil',
          'Conserves electricity and ground water pumping costs',
        ],
        iconName: 'water',
      });
    } else {
      activities.push({
        id: 'activity-irrigation-apply',
        timeWindow: '03:30 – 06:00 PM',
        activityName: 'Light Irrigation',
        localizedActivityName: {
          en: 'Light Irrigation',
          mr: 'हलके पाणी / सिंचन करा',
          hi: 'हल्की सिंचाई करें',
          gu: 'હળવી સિંચાઈ કરો',
          ta: 'லேசான பாசனம்',
          te: 'తేలికపాటి నీరు',
          kn: 'ಲಘು ನೀರಾವರಿ',
          ml: 'നേരിയ നനയ്ക്കൽ',
          bn: 'হালকা সেচ দিন',
          pa: 'ਹਲਕੀ ਸਿੰਚਾਈ ਕਰੋ',
          or: 'ହାଲୁକା ଜଳସେଚନ କରନ୍ତୁ',
        },
        category: 'irrigation',
        statusBadge: 'Recommended',
        localizedStatusBadge: {
          en: 'Recommended',
          mr: 'शिफारस',
          hi: 'अनुशंसित',
          gu: 'ભલામણ કરેલ',
          ta: 'பரிந்துரைக்கப்படுகிறது',
          te: 'సిఫార్సు చేయబడింది',
          kn: 'ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ',
          ml: 'ശുപാർശ ചെയ്യുന്നു',
          bn: 'সুপারিশকৃত',
          pa: 'ਸਿਫਾਰਸ਼ ਕੀਤੀ',
          or: 'ସୁପାରିଶ କରାଯାଇଛି',
        },
        statusType: 'good',
        suitabilityScore: 88,
        summaryReason: 'No rain expected • Late afternoon reduces evaporation loss',
        localizedSummaryReason: {
          en: 'No rain expected • Late afternoon reduces evaporation loss',
          mr: 'पावसाची शक्यता नाही • बाष्पीभवन कमी होऊन मुळांना फायदा',
          hi: 'बारिश नहीं • वाष्पीकरण कम होने से जड़ों को पूरा लाभ',
          gu: 'વરસાદ નથી • બાષ્પીભવન ઓછું થશે',
          ta: 'மழை இல்லை • ஆவியாதல் குறைவு',
          te: 'వర్షం లేదు • ఆవిరి నష్టం తక్కువ',
          kn: 'ಮಳೆಯಿಲ್ಲ • ಆವಿಯಾಗುವಿಕೆ ಕಡಿಮೆ',
          ml: 'മഴയില്ല • ബാഷ്പീകരണം കുറവ്',
          bn: 'বৃষ্টি নেই • বাষ্পীভবন কম হবে',
          pa: 'ਮੀਂਹ ਨਹੀਂ • ਪਾਣੀ ਉੱਡਣ ਦਾ ਨੁਕਸਾਨ ਘੱਟ',
          or: 'ବର୍ଷା ନାହିଁ • ବାଷ୍ପୀଭବନ କମ୍ ହେବ',
        },
        whyPoints: [
          'Late afternoon irrigation allows water infiltration overnight',
          `Maintains soil moisture for ${cropProfile.name} in current growth phase`,
          'Zero risk of soil crusting from high mid-day heat',
        ],
        iconName: 'water',
      });
    }

    // --- Activity 5: Evening Weather / Equipment Protection ---
    activities.push({
      id: 'activity-evening',
      timeWindow: 'After 06:00 PM',
      activityName: hasRainExpected ? 'Rain Expected — Protect Gear' : 'Secure Farm & Equipment',
      localizedActivityName: {
        en: hasRainExpected ? 'Rain Expected — Protect Gear' : 'Secure Farm & Equipment',
        mr: hasRainExpected ? 'पावसाची शक्यता — अवजारे झाकून ठेवा' : 'दिवसाची कामे पूर्ण करा व साधने सुरक्षित ठेवा',
        hi: hasRainExpected ? 'बारिश संभावित — उपकरण सुरक्षित रखें' : 'खेत कार्य समाप्त करें एवं उपकरण संभालें',
        gu: hasRainExpected ? 'વરસાદ સંભવ — સાધનો ઢાંકો' : 'સાધનો સાચવો',
        ta: hasRainExpected ? 'மழை வாய்ப்பு — கருவிகளை பாதுகாக்கவும்' : 'கருவிகளை பாதுகாக்கவும்',
        te: hasRainExpected ? 'వర్షం అవకాశం — పరికరాలు భద్రపరచండి' : 'పరికరాలు భద్రపరచండి',
        kn: hasRainExpected ? 'ಮಳೆ ನಿರೀಕ್ಷೆ — ಉಪಕರಣ ರಕ್ಷಿಸಿ' : 'ಉಪಕರಣಗಳನ್ನು ಭದ್ರಪಡಿಸಿ',
        ml: hasRainExpected ? 'മഴ സാധ്യത — ഉപകരണങ്ങൾ സൂക്ഷിക്കുക' : 'ഉപകരണങ്ങൾ സൂക്ഷിക്കുക',
        bn: hasRainExpected ? 'বৃষ্টির সম্ভাবনা — যন্ত্রপাতি ঢাকুন' : 'যন্ত্রপাতি সুরক্ষিত রাখুন',
        pa: hasRainExpected ? 'ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ — ਸੰਦ ਸੁਰੱਖਿਅਤ ਰੱਖੋ' : 'ਸੰਦ ਸੰਭਾਲੋ',
        or: hasRainExpected ? 'ବର୍ଷା ସମ୍ଭାବନା — ଉପକରଣ ଘୋଡ଼ାନ୍ତୁ' : 'ଉପକରଣ ସୁରକ୍ଷିତ ରଖନ୍ତୁ',
      },
      category: 'rain_warning',
      statusBadge: hasRainExpected ? 'High Precaution' : 'Normal',
      localizedStatusBadge: {
        en: hasRainExpected ? 'High Precaution' : 'Normal',
        mr: hasRainExpected ? 'दक्षता बाळगा' : 'सामान्य',
        hi: hasRainExpected ? 'सावधानी बरतें' : 'सामान्य',
        gu: 'સાવચેતી',
        ta: 'எச்சரிக்கை',
        te: 'జాగ్రత్త',
        kn: 'ಮುನ್ನೆಚ್ಚರಿಕೆ',
        ml: 'ജാഗ്രത',
        bn: 'সতર્કতা',
        pa: 'ਸਾਵਧਾਨੀ',
        or: 'ସତର୍କତା',
      },
      statusType: hasRainExpected ? 'rain' : 'good',
      suitabilityScore: null,
      summaryReason: hasRainExpected
        ? 'Cover harvested produce, fertilizer bags and electrical pump sets'
        : 'Ensure irrigation channels are clear and farm gates locked',
      localizedSummaryReason: {
        en: hasRainExpected
          ? 'Cover harvested produce, fertilizer bags and electrical pump sets'
          : 'Ensure irrigation channels are clear and farm gates locked',
        mr: 'कापणी केलेला माल, खतांची पोती आणि मोटार/पंप सुरक्षित झाकून ठेवा',
        hi: 'कटी फसल, खाद की बोरियां और मोटर/पंप सुरक्षित ढक कर रखें',
        gu: 'ખાતર અને પંપને ઢાંકીને સાચવો',
        ta: 'எரு மற்றும் பம்புகளை மூடி பாதுகாக்கவும்',
        te: 'ఎరువులు మరియు పంపులను కప్పి ఉంచండి',
        kn: 'ಗೊಬ್ಬರ ಮತ್ತು ಪಂಪ್‌ಗಳನ್ನು ಮುಚ್ಚಿಡಿ',
        ml: 'വളങ്ങളും പമ്പുകളും മൂടിവെക്കുക',
        bn: 'সার ও পাম্প ঢেকে রাখুন',
        pa: 'ਖਾਦ ਅਤੇ ਪੰਪ ਢੱਕ ਕੇ ਰੱਖੋ',
        or: 'ଖତ ଏବଂ ପମ୍ପ ଘୋଡ଼ାଇ ରଖନ୍ତୁ',
      },
      whyPoints: [
        'Protect stored fertilizers and seeds from moisture spikes',
        'Avoid operating field machinery in wet soil to prevent tyre slippage',
      ],
      iconName: 'cloud-rain',
    });

    // Comparison Scenarios
    const comparisons: OptionComparison[] = [
      {
        id: 'comp-irrigate',
        title: 'Should I irrigate now or wait?',
        localizedTitle: {
          en: 'Should I irrigate now or wait?',
          mr: 'आत्ता पाणी द्यावे की थांबावे?',
          hi: 'अभी सिंचाई करें या इंतजार करें?',
          gu: 'હમણાં સિંચાઈ કરવી કે રાહ જોવી?',
          ta: 'இப்போது பாசனம் செய்யலாமா அல்லது காத்திருக்கலாமா?',
          te: 'ఇప్పుడే నీరు పెట్టాలా లేక ఆగాలా?',
          kn: 'ಈಗಲೇ ನೀರಾವರಿ ಮಾಡಬೇಕೆ ಅಥವಾ ಕಾಯಬೇಕೆ?',
          ml: 'ഇപ്പോൾ നനയ്ക്കണമോ അതോ കാത്തിരിക്കണമോ?',
          bn: 'এখনই সেচ দেবেন নাকি অপেক্ষা করবেন?',
          pa: 'ਹੁਣੇ ਸਿੰਚਾਈ ਕਰੀਏ ਜਾਂ ਉਡੀਕੀਏ?',
          or: 'ବର୍ତ୍ତମାନ ଜଳସେଚନ କରିବେ ନା ଅପେକ୍ଷା କରିବେ?',
        },
        optionA: {
          title: 'Irrigate Now',
          points: [
            'Water use: High cost',
            `Rain risk: ${hasRainExpected ? 'High wash-out' : 'Low'}`,
            `Crop water demand: Normal`,
          ],
          isRecommended: !hasRainExpected,
        },
        optionB: {
          title: 'Wait for Rain',
          points: [
            'Rain forecast in 24h',
            'Saves electricity & water',
            'Prevents root waterlogging',
          ],
          isRecommended: hasRainExpected,
        },
      },
      {
        id: 'comp-spray',
        title: 'Spray today morning or tomorrow?',
        localizedTitle: {
          en: 'Spray today morning or tomorrow?',
          mr: 'आज सकाळी फवारणी करावी की उद्या?',
          hi: 'आज सुबह छिड़काव करें या कल?',
          gu: 'આજે સવારે છંટકાવ કરવો કે કાલે?',
          ta: 'இன்று காலை தெளிக்கலாமா அல்லது நாளையா?',
          te: 'ఈరోజు ఉదయమే స్ప్రే చేయాలా లేక రేపా?',
          kn: 'ಇಂದು ಬೆಳಿಗ್ಗೆ ಸಿಂಪಡಿಸಬೇಕೆ ಅಥವಾ ನಾಳೆಯೇ?',
          ml: 'ഇന്ന് രാവിലെ തളിക്കണമോ അതോ നാളെയോ?',
          bn: 'আজ সকালে স্প্রে করবেন নাকি কাল?',
          pa: 'ਅੱਜ ਸਵੇਰੇ ਸਪਰੇਅ ਕਰੀਏ ਜਾਂ ਕੱਲ੍ਹ?',
          or: 'ଆଜି ସକାଳେ ସ୍ପ୍ରେ କରିବେ ନା କାଲି?',
        },
        optionA: {
          title: 'Today Morning',
          points: [
            `Wind speed low (${windSpeed} km/h)`,
            'High leaf absorption (94/100)',
            'Clear 4h weather window',
          ],
          isRecommended: sprayScore >= 75,
        },
        optionB: {
          title: 'Tomorrow',
          points: [
            'Higher cloudiness predicted',
            'Possible morning humidity drop',
            'Risk of rain interference',
          ],
          isRecommended: sprayScore < 75,
        },
      },
    ];

    // Compute Overall Score
    const overallScore = Math.round((sprayScore + inspectScore + (hasRainExpected ? 70 : 85)) / 3);
    const overallRating =
      overallScore >= 85
        ? 'Excellent day for planned farm activities'
        : overallScore >= 70
        ? 'Good day for farm activities with minor precautions'
        : 'Caution advised due to weather shifts';

    return {
      overallScore,
      overallRating,
      factors: {
        rain: hasRainExpected ? 'Moderate' : 'Good',
        wind: windSpeed > 15 ? 'High Risk' : windSpeed > 10 ? 'Moderate' : 'Good',
        temperature: hasHighHeat ? 'High Heat' : 'Good',
        water: hasRainExpected ? 'Moderate' : 'Good',
      },
      activities,
      comparisons,
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

export const farmRouteEngine = new FarmRouteEngine();
