import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export type LanguageCode =
  | 'en'
  | 'hi'
  | 'mr'
  | 'ta'
  | 'te'
  | 'bn'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'or'
  | 'pa';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  script?: string;
}

export const DEFAULT_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Oriya' },
];

export const LANGUAGES = DEFAULT_LANGUAGES;

const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    tagline: 'Your Weather. Your Language. Your Decision.',
    headline: 'Weather intelligence, made conversational.',
    subtitle: 'Ask. Understand. Act.',
    useLocation: 'Use My Location',
    chooseLocation: 'Choose Location',
    detectingLocation: 'Detecting your location...',
    askPlaceholder: 'Ask anything about the weather...',
    askWeatherGPT: 'Ask WeatherGPT',
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    howCanIHelp: 'How can I help you with the weather today?',
    todayForecast: "Today's Forecast",
    sevenDayForecast: '7-Day Forecast',
    weatherAroundYou: 'Weather Around You',
    recommendationTitle: "Today's Recommendation",
    proactiveTitle: 'WeatherGPT noticed something',
    whyThisAnswer: 'Why this answer?',
    farmerTitle: '🌾 Crop Weather Advisory',
    fisherTitle: '🎣 Marine Advisory',
    emergencyTitle: '🚨 EMERGENCY MODE',
    simpleMode: 'Simple Mode',
    temperature: 'Temperature',
    humidity: 'Humidity',
    wind: 'Wind',
    visibility: 'Visibility',
    alerts: 'Alerts',
    rainProbability: 'Rain Probability',
    feelsLike: 'Feels Like',
    uvIndex: 'UV Index',
    pressure: 'Pressure',
    listening: 'Listening...',
    processing: 'Processing...',
    responding: 'WeatherGPT is responding...',
    playingResponse: 'Playing response...',
  },
  hi: {
    tagline: 'आपका मौसम। आपकी भाषा। आपका निर्णय।',
    headline: 'मौसम बुद्धिमत्ता, अब बातचीत के साथ।',
    subtitle: 'पूछें। समझें। कार्य करें।',
    useLocation: 'मेरी सटीक स्थान स्थिति का उपयोग करें',
    chooseLocation: 'स्थान चुनें',
    detectingLocation: 'आपके स्थान की पहचान की जा रही है...',
    askPlaceholder: 'मौसम के बारे में कुछ भी पूछें...',
    askWeatherGPT: 'WeatherGPT से पूछें',
    goodMorning: 'शुभ प्रभात',
    goodAfternoon: 'शुभ दोपहर',
    goodEvening: 'शुभ संध्या',
    howCanIHelp: 'आज मैं मौसम के बारे में आपकी क्या मदद कर सकता हूँ?',
    todayForecast: 'आज का पूर्वानुमान',
    sevenDayForecast: '7 दिनों का पूर्वानुमान',
    weatherAroundYou: 'आपके आसपास का मौसम',
    recommendationTitle: 'आज की सिफारिश',
    proactiveTitle: 'WeatherGPT ने कुछ ध्यान दिया',
    whyThisAnswer: 'यह उत्तर क्यों?',
    farmerTitle: '🌾 फसल मौसम परामर्श',
    fisherTitle: '🎣 समुद्री मौसम सलाह',
    emergencyTitle: '🚨 आपातकालीन मोड',
    simpleMode: 'सरल मोड',
    temperature: 'तापमान',
    humidity: 'आर्द्रता',
    wind: 'हवा',
    visibility: 'दृश्यता',
    alerts: 'चेतावनी',
    rainProbability: 'बारिश की संभावना',
    feelsLike: 'महसूस हो रहा है',
    uvIndex: 'यूवी सूचकांक',
    pressure: 'दबाव',
    listening: 'सुन रहा हूँ...',
    processing: 'प्रक्रिया जारी है...',
    responding: 'WeatherGPT उत्तर तैयार कर रहा है...',
    playingResponse: 'उत्तर सुनाया जा रहा है...',
  },
  mr: {
    tagline: 'तुमचे हवामान. तुमची भाषा. तुमचा निर्णय.',
    headline: 'हवामान बुद्धिमत्ता, आता संभाषणात्मक.',
    subtitle: 'विचारा. समजून घ्या. कृती करा.',
    useLocation: 'माझे स्थान वापरा',
    chooseLocation: 'स्थान निवडा',
    detectingLocation: 'तुमचे स्थान शोधत आहे...',
    askPlaceholder: 'हवामानाबद्दल काहीही विचारा...',
    askWeatherGPT: 'WeatherGPT ला विचारा',
    goodMorning: 'शुभ प्रभात',
    goodAfternoon: 'शुभ दुपार',
    goodEvening: 'शुभ संध्या',
    howCanIHelp: 'आज मी तुम्हाला हवामानाबद्दल कशी मदत करू शकतो?',
    todayForecast: 'आजचा अंदाज',
    sevenDayForecast: '७ दिवसांचा अंदाज',
    weatherAroundYou: 'तुमच्या सभोवतालचे हवामान',
    recommendationTitle: 'आजची शिफारस',
    proactiveTitle: 'WeatherGPT ला काही आढळले',
    whyThisAnswer: 'हे उत्तर का?',
    farmerTitle: '🌾 पीक हवामान सल्ला',
    fisherTitle: '🎣 सागरी हवामान सल्ला',
    emergencyTitle: '🚨 आणीबाणी मोड',
    simpleMode: 'सोपा मोड',
    temperature: 'तापमान',
    humidity: 'आर्द्रता',
    wind: 'वारा',
    visibility: 'दृश्यता',
    alerts: 'इशारे',
    rainProbability: 'पावसाची शक्यता',
    feelsLike: 'जाणवणारे तापमान',
    uvIndex: 'यूव्ही निर्देशांक',
    pressure: 'हवेचा दाब',
    listening: 'ऐकत आहे...',
    processing: 'प्रक्रिया सुरू आहे...',
    responding: 'WeatherGPT उत्तर देत आहे...',
    playingResponse: 'उत्तर ऐकवत आहे...',
  },
  ta: {
    tagline: 'உங்கள் வானிலை. உங்கள் மொழி. உங்கள் முடிவு.',
    headline: 'வானிலை நுண்ணறிவு, இப்போது உரையாடல் வடிவில்.',
    subtitle: 'கேளுங்கள். புரிந்துகொள்ளுங்கள். செயல்படுங்கள்.',
    useLocation: 'என் இருப்பிடத்தைப் பயன்படுத்து',
    chooseLocation: 'இருப்பிடத்தைத் தேர்ந்தெடு',
    detectingLocation: 'இருப்பிடத்தைக் கண்டறிகிறது...',
    askPlaceholder: 'வானிலை பற்றி எதையும் கேளுங்கள்...',
    askWeatherGPT: 'WeatherGPT-யிடம் கேளுங்கள்',
    goodMorning: 'காலை வணக்கம்',
    goodAfternoon: 'மதிய வணக்கம்',
    goodEvening: 'மாலை வணக்கம்',
    howCanIHelp: 'இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?',
    todayForecast: 'இன்றைய முன்னறிவிப்பு',
    sevenDayForecast: '7-நாள் முன்னறிவிப்பு',
    weatherAroundYou: 'உங்களைச் சுற்றியுள்ள வானிலை',
    recommendationTitle: 'இன்றைய பரிந்துரை',
    proactiveTitle: 'WeatherGPT கவனித்தது',
    whyThisAnswer: 'இந்த பதில் ஏன்?',
    farmerTitle: '🌾 பயிர் வானிலை ஆலோசனை',
    fisherTitle: '🎣 கடல்சார் ஆலோசனை',
    emergencyTitle: '🚨 அவசர முறை',
    simpleMode: 'எளிய முறை',
    temperature: 'வெப்பநிலை',
    humidity: 'ஈரப்பதம்',
    wind: 'காற்று',
    visibility: 'பார்வைத்திறன்',
    alerts: 'எச்சரிக்கைகள்',
    rainProbability: 'மழை வாய்ப்பு',
    feelsLike: 'உணரப்படும் வெப்பநிலை',
    uvIndex: 'UV குறியீடு',
    pressure: 'அழுத்தம்',
    listening: 'கேட்கிறது...',
    processing: 'செயலாக்குகிறது...',
    responding: 'WeatherGPT பதிலளிக்கிறது...',
    playingResponse: 'பதிலை இயக்குகிறது...',
  },
  te: {
    tagline: 'మీ వాతావరణం. మీ భాష. మీ నిర్ణయం.',
    headline: 'వాతావరణ మేధస్సు, ఇప్పుడు సంభాషణల రూపంలో.',
    subtitle: 'అడగండి. అర్థం చేసుకోండి. చర్య తీసుకోండి.',
    useLocation: 'నా స్థానాన్ని ఉపయోగించండి',
    chooseLocation: 'స్థానాన్ని ఎంచుకోండి',
    detectingLocation: 'మీ స్థానాన్ని గుర్తిస్తోంది...',
    askPlaceholder: 'వాతావరణం గురించి ఏదైనా అడగండి...',
    askWeatherGPT: 'WeatherGPTని అడగండి',
    goodMorning: 'శుభోదయం',
    goodAfternoon: 'శుభ మధ్యాహ్నం',
    goodEvening: 'శుభ సాయంత్రం',
    howCanIHelp: 'ఈరోజు వాతావరణం గురించి నేను మీకు ఎలా సహాయపడగలను?',
    todayForecast: 'నేటి సూచన',
    sevenDayForecast: '7-రోజుల సూచన',
    weatherAroundYou: 'మీ చుట్టూ ఉన్న వాతావరణం',
    recommendationTitle: 'నేటి సిఫార్సు',
    proactiveTitle: 'WeatherGPT గమనించింది',
    whyThisAnswer: 'ఈ సమాధానం ఎందుకు?',
    farmerTitle: '🌾 పంట వాతావరణ సలహా',
    fisherTitle: '🎣 సముద్ర సలహా',
    emergencyTitle: '🚨 అత్యవసర మోడ్',
    simpleMode: 'సరళమైన మోడ్',
    temperature: 'ఉష్ణోగ్రత',
    humidity: 'తేమ',
    wind: 'గాలి',
    visibility: 'దృశ్యమానత',
    alerts: 'హెచ్చరికలు',
    rainProbability: 'వర్ష సూచన',
    feelsLike: 'అనిపించే ఉష్ణోగ్రత',
    uvIndex: 'UV సూచిక',
    pressure: 'పీడనం',
    listening: 'వింటోంది...',
    processing: 'ప్రాసెస్ చేస్తోంది...',
    responding: 'WeatherGPT స్పందిస్తోంది...',
    playingResponse: 'సమాధానం వినిపిస్తోంది...',
  },
  kn: {
    tagline: 'ನಿಮ್ಮ ಹವಾಮಾನ. ನಿಮ್ಮ ಭಾಷೆ. ನಿಮ್ಮ ನಿರ್ಧಾರ.',
    headline: 'ಹವಾಮಾನ ಬುದ್ಧಿವಂತಿಕೆ, ಈಗ ಸಂಭಾಷಣಾತ್ಮಕ.',
    subtitle: 'ಕೇಳಿ. ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ. ಕಾರ್ಯನಿರ್ವಹಿಸಿ.',
    useLocation: 'ನನ್ನ ಸ್ಥಳವನ್ನು ಬಳಸಿ',
    chooseLocation: 'ಸ್ಥಳವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    detectingLocation: 'ಸ್ಥಳವನ್ನು ಪತ್ತೆಮಾಡಲಾಗುತ್ತಿದೆ...',
    askPlaceholder: 'ಹವಾಮಾನದ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ...',
    askWeatherGPT: 'WeatherGPT ಗೆ ಕೇಳಿ',
    goodMorning: 'ಶುಭೋದಯ',
    goodAfternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ',
    goodEvening: 'ಶುಭ ಸಂಜೆ',
    howCanIHelp: 'ಇಂದು ಹವಾಮಾನದ ಬಗ್ಗೆ ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
    todayForecast: 'ಇಂದಿನ ಮುನ್ಸೂಚನೆ',
    sevenDayForecast: '೭ ದಿನಗಳ ಮುನ್ಸೂಚನೆ',
    weatherAroundYou: 'ನಿಮ್ಮ ಸುತ್ತಲಿನ ಹವಾಮಾನ',
    recommendationTitle: 'ಇಂದಿನ ಶಿಫಾರಸು',
    proactiveTitle: 'WeatherGPT ಗಮನಿಸಿದೆ',
    whyThisAnswer: 'ಈ ಉತ್ತರ ಏಕೆ?',
    farmerTitle: '🌾 ಬೆಳೆ ಹವಾಮಾನ ಸಲಹೆ',
    fisherTitle: '🎣 ಸಾಗರ ಸಲಹೆ',
    emergencyTitle: '🚨 ತುರ್ತು ಮೋಡ್',
    simpleMode: 'ಸರಳ ಮೋಡ್',
    temperature: 'ತಾಪಮಾನ',
    humidity: 'ಆರ್ದ್ರತೆ',
    wind: 'ಗಾಳಿ',
    visibility: 'ಗೋಚರತೆ',
    alerts: 'ಎಚ್ಚರಿಕೆಗಳು',
    rainProbability: 'ಮಳೆಯ ಸಾಧ್ಯತೆ',
    feelsLike: 'ಅನುಭವವಾಗುವ ತಾಪಮಾನ',
    uvIndex: 'ಯುವಿ ಸೂಚ್ಯಂಕ',
    pressure: 'ಒತ್ತಡ',
    listening: 'ಆಲಿಸಲಾಗುತ್ತಿದೆ...',
    processing: 'ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...',
    responding: 'WeatherGPT ಉತ್ತರಿಸುತ್ತಿದೆ...',
    playingResponse: 'ಉತ್ತರವನ್ನು ಪ್ಲೇ ಮಾಡಲಾಗುತ್ತಿದೆ...',
  },
  ml: {
    tagline: 'നിങ്ങളുടെ കാലാവസ്ഥ. നിങ്ങളുടെ ഭാഷ. നിങ്ങളുടെ തീരുമാനം.',
    headline: 'കാലാവസ്ഥാ ബുദ്ധി, ഇനി സംഭാഷണ രൂപത്തിൽ.',
    subtitle: 'ചോദിക്കൂ. മനസ്സിലാക്കൂ. പ്രവർത്തിക്കൂ.',
    useLocation: 'എന്റെ ലൊക്കേഷൻ ഉപയോഗിക്കുക',
    chooseLocation: 'ലൊക്കേഷൻ തിരഞ്ഞെടുക്കുക',
    detectingLocation: 'ലൊക്കേഷൻ കണ്ടെത്തുന്നു...',
    askPlaceholder: 'കാലാവസ്ഥയെക്കുറിച്ച് എന്തും ചോദിക്കൂ...',
    askWeatherGPT: 'WeatherGPT-യോട് ചോദിക്കൂ',
    goodMorning: 'സുപ്രഭാതം',
    goodAfternoon: 'ശുഭ ഉച്ചതിരിഞ്ഞ്',
    goodEvening: 'ശുഭ സായാഹ്നം',
    howCanIHelp: 'ഇന്ന് കാലാവസ്ഥയെക്കുറിച്ച് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കും?',
    todayForecast: 'ഇന്നത്തെ പ്രവചനം',
    sevenDayForecast: '7 ദിവസത്തെ പ്രവചനം',
    weatherAroundYou: 'നിങ്ങൾക്ക് ചുറ്റുമുള്ള കാലാവസ്ഥ',
    recommendationTitle: 'ഇന്നത്തെ ശുപാർശ',
    proactiveTitle: 'WeatherGPT കണ്ടെത്തിയത്',
    whyThisAnswer: 'എന്തുകൊണ്ട് ഈ ഉത്തരം?',
    farmerTitle: '🌾 വിള കാലാവസ്ഥാ ഉപദേശം',
    fisherTitle: '🎣 സമുദ്ര ഉപദേശം',
    emergencyTitle: '🚨 അടിയന്തര മോഡ്',
    simpleMode: 'ലളിതമായ മോഡ്',
    temperature: 'താപനില',
    humidity: 'ഈർപ്പം',
    wind: 'കാറ്റ്',
    visibility: 'കാഴ്ചാപരിധി',
    alerts: 'മുന്നറിയിപ്പുകൾ',
    rainProbability: 'മഴ സാധ്യത',
    feelsLike: 'അനുഭവപ്പെടുന്ന ചൂട്',
    uvIndex: 'യുവി സൂചിക',
    pressure: 'മർദ്ദം',
    listening: 'കേൾക്കുന്നു...',
    processing: 'പ്രോസസ്സ് ചെയ്യുന്നു...',
    responding: 'WeatherGPT പ്രതികരിക്കുന്നു...',
    playingResponse: 'മറുപടി പ്ലേ ചെയ്യുന്നു...',
  },
  bn: {
    tagline: 'আপনার আবহাওয়া। আপনার ভাষা। আপনার সিদ্ধান্ত।',
    headline: 'আবহাওয়া বুদ্ধিমত্তা, এখন কথোপকথনের মাধ্যমে।',
    subtitle: 'জিজ্ঞাসা করুন। বুঝুন। সিদ্ধান্ত নিন।',
    useLocation: 'আমার অবস্থান ব্যবহার করুন',
    chooseLocation: 'অবস্থান নির্বাচন করুন',
    detectingLocation: 'অবস্থান সনাক্ত করা হচ্ছে...',
    askPlaceholder: 'আবহাওয়া সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন...',
    askWeatherGPT: 'WeatherGPT-কে জিজ্ঞাসা করুন',
    goodMorning: 'সুপ্রভাত',
    goodAfternoon: 'শুভ অপরাহ্ন',
    goodEvening: 'শুভ সন্ধ্যা',
    howCanIHelp: 'আজ আমি আবহাওয়া সম্পর্কে আপনাকে কীভাবে সাহায্য করতে পারি?',
    todayForecast: 'আজকের পূর্বাভাস',
    sevenDayForecast: '৭ দিনের পূর্বাভাস',
    weatherAroundYou: 'আপনার আশেপাশের আবহাওয়া',
    recommendationTitle: 'আজকের পরামর্শ',
    proactiveTitle: 'WeatherGPT লক্ষ্য করেছে',
    whyThisAnswer: 'কেন এই উত্তর?',
    farmerTitle: '🌾 ফসল আবহাওয়া পরামর্শ',
    fisherTitle: '🎣 সামুদ্রিক পরামর্শ',
    emergencyTitle: '🚨 জরুরি মোড',
    simpleMode: 'সহজ মোড',
    temperature: 'তাপমাত্রা',
    humidity: 'আর্দ্রতা',
    wind: 'বাতাস',
    visibility: 'দৃশ্যমানতা',
    alerts: 'সতর্কতা',
    rainProbability: 'বৃষ্টির সম্ভাবনা',
    feelsLike: 'অনুভূত তাপমাত্রা',
    uvIndex: 'ইউভি সূচক',
    pressure: 'বায়ুচাপ',
    listening: 'শুনছি...',
    processing: 'প্রক্রিয়াকরণ হচ্ছে...',
    responding: 'WeatherGPT উত্তর দিচ্ছে...',
    playingResponse: 'উত্তর শোনানো হচ্ছে...',
  },
  gu: {
    tagline: 'તમારું હવામાન. તમારી ભાષા. તમારો નિર્ણય.',
    headline: 'હવામાન બુદ્ધિ, હવે વાતચીત દ્વારા.',
    subtitle: 'પૂછો. સમજો. કાર્ય કરો.',
    useLocation: 'મારું સ્થાન વાપરો',
    chooseLocation: 'સ્થાન પસંદ કરો',
    detectingLocation: 'તમારું સ્થાન શોધી રહ્યું છે...',
    askPlaceholder: 'હવામાન વિશે કંઈપણ પૂછો...',
    askWeatherGPT: 'WeatherGPT ને પૂછો',
    goodMorning: 'શુભ સવાર',
    goodAfternoon: 'શુભ બપોર',
    goodEvening: 'શુભ સાંજ',
    howCanIHelp: 'આજે હું હવામાન વિશે તમને કેવી રીતે મદદ કરી શકું?',
    todayForecast: 'આજનો અંદાજ',
    sevenDayForecast: '૭ દિવસનો અંદાજ',
    weatherAroundYou: 'તમારી આસપાસનું હવામાન',
    recommendationTitle: 'આજની ભલામણ',
    proactiveTitle: 'WeatherGPT એ કંઈક નોંધ્યું',
    whyThisAnswer: 'આ જવાબ કેમ?',
    farmerTitle: '🌾 પાક હવામાન સલાહ',
    fisherTitle: '🎣 દરિયાઈ સલાહ',
    emergencyTitle: '🚨 કટોકટી મોડ',
    simpleMode: 'સરળ મોડ',
    temperature: 'તાપમાન',
    humidity: 'ભેજ',
    wind: 'પવન',
    visibility: 'દ્રશ્યતા',
    alerts: 'ચેતવણીઓ',
    rainProbability: 'વરસાદની શક્યતા',
    feelsLike: 'અનુભવાતું તાપમાન',
    uvIndex: 'યુવી ઇન્ડેક્સ',
    pressure: 'દબાણ',
    listening: 'સાંભળી રહ્યું છે...',
    processing: 'પ્રક્રિયા ચાલુ છે...',
    responding: 'WeatherGPT જવાબ આપી રહ્યું છે...',
    playingResponse: 'જવાબ સંભળાવી રહ્યું છે...',
  },
  pa: {
    tagline: 'ਤੁਹਾਡਾ ਮੌਸਮ। ਤੁਹਾਡੀ ਭਾਸ਼ਾ। ਤੁਹਾਡਾ ਫੈਸਲਾ।',
    headline: 'ਮੌਸਮ ਬੁੱਧੀ, ਹੁਣ ਗੱਲਬਾਤ ਰਾਹੀਂ।',
    subtitle: 'ਪੁੱਛੋ। ਸਮਝੋ। ਅਮਲ ਕਰੋ।',
    useLocation: 'ਮੇਰਾ ਸਥਾਨ ਵਰਤੋ',
    chooseLocation: 'ਸਥਾਨ ਚੁਣੋ',
    detectingLocation: 'ਤੁਹਾਡਾ ਸਥਾਨ ਲੱਭਿਆ ਜਾ ਰਿਹਾ ਹੈ...',
    askPlaceholder: 'ਮੌਸਮ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ...',
    askWeatherGPT: 'WeatherGPT ਨੂੰ ਪੁੱਛੋ',
    goodMorning: 'ਸ਼ੁਭ ਸਵੇਰ',
    goodAfternoon: 'ਸ਼ੁਭ ਦੁਪਹਿਰ',
    goodEvening: 'ਸ਼ੁਭ ਸ਼ਾਮ',
    howCanIHelp: 'ਅੱਜ ਮੈਂ ਮੌਸਮ ਬਾਰੇ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?',
    todayForecast: 'ਅੱਜ ਦਾ ਪੂਰਵ ਅਨੁਮਾਨ',
    sevenDayForecast: '7 ਦਿਨਾਂ ਦਾ ਪੂਰਵ ਅਨੁਮਾਨ',
    weatherAroundYou: 'ਤੁਹਾਡੇ ਆਲੇ-ਦੁਆਲੇ ਦਾ ਮੌਸਮ',
    recommendationTitle: 'ਅੱਜ ਦੀ ਸਿਫਾਰਸ਼',
    proactiveTitle: 'WeatherGPT ਨੇ ਕੁਝ ਦੇਖਿਆ',
    whyThisAnswer: 'ਇਹ ਜਵਾਬ ਕਿਉਂ?',
    farmerTitle: '🌾 ਫਸਲ ਮੌਸਮ ਸਲਾਹ',
    fisherTitle: '🎣 ਸਮੁੰਦਰੀ ਸਲਾਹ',
    emergencyTitle: '🚨 ਐਮਰਜੈਂਸੀ ਮੋਡ',
    simpleMode: 'ਸਧਾਰਨ ਮੋਡ',
    temperature: 'ਤਾਪਮਾਨ',
    humidity: 'ਨਮੀ',
    wind: 'ਹਵਾ',
    visibility: 'ਦਿੱਖ',
    alerts: 'ਚੇਤਾਵਨੀਆਂ',
    rainProbability: 'ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ',
    feelsLike: 'ਮਹਿਸੂਸ ਹੁੰਦਾ ਤਾਪਮਾਨ',
    uvIndex: 'ਯੂਵੀ ਇੰਡੈਕਸ',
    pressure: 'ਦਬਾਅ',
    listening: 'ਸੁਣ ਰਿਹਾ ਹੈ...',
    processing: 'ਪ੍ਰਕਿਰਿਆ ਜਾਰੀ ਹੈ...',
    responding: 'WeatherGPT ਜਵਾਬ ਦੇ ਰਿਹਾ ਹੈ...',
    playingResponse: 'ਜਵਾਬ ਚਲਾਇਆ ਜਾ ਰਿਹਾ ਹੈ...',
  },
  or: {
    tagline: 'ଆପଣଙ୍କ ପାଣିପାଗ | ଆପଣଙ୍କ ଭାଷା | ଆପଣଙ୍କ ନିଷ୍ପତ୍ତି |',
    headline: 'ପାଣିପାଗ ବୁଦ୍ଧିମତା, ଏବେ କଥାବାର୍ତ୍ତା ମାଧ୍ୟମରେ |',
    subtitle: 'ପଚାରନ୍ତୁ | ବୁଝନ୍ତୁ | କାର୍ଯ୍ୟ କରନ୍ତୁ |',
    useLocation: 'ମୋର ସ୍ଥାନ ବ୍ୟବହାର କରନ୍ତୁ',
    chooseLocation: 'ସ୍ଥାନ ବାଛନ୍ତୁ',
    detectingLocation: 'ଆପଣଙ୍କ ସ୍ଥାନ ଖୋଜାଯାଉଛି...',
    askPlaceholder: 'ପାଣିପାଗ ବିଷୟରେ ଯାହା କିଛି ପଚାରନ୍ତୁ...',
    askWeatherGPT: 'WeatherGPT କୁ ପଚାରନ୍ତୁ',
    goodMorning: 'ଶୁଭ ପ୍ରଭାତ',
    goodAfternoon: 'ଶୁଭ ଅପରାହ୍ନ',
    goodEvening: 'ଶୁଭ ସନ୍ଧ୍ୟା',
    howCanIHelp: 'ଆଜି ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?',
    todayForecast: 'ଆଜିର ପୂର୍ବାନୁମାନ',
    sevenDayForecast: '୭ ଦିନର ପୂର୍ବାନୁମାନ',
    weatherAroundYou: 'ଆପଣଙ୍କ ଚାରିପାଖର ପାଣିପାଗ',
    recommendationTitle: 'ଆଜିର ପରାମର୍ଶ',
    proactiveTitle: 'WeatherGPT କିଛି ଲକ୍ଷ୍ୟ କରିଛି',
    whyThisAnswer: 'ଏହି ଉତ୍ତର କାହିଁକି?',
    farmerTitle: '🌾 ଫସଲ ପାଣିପାଗ ପରାମର୍ଶ',
    fisherTitle: '🎣 ସାମୁଦ୍ରିକ ପରାମର୍ଶ',
    emergencyTitle: '🚨 ଜରୁରୀକାଳୀନ ମୋଡ୍',
    simpleMode: 'ସରଳ ମୋଡ୍',
    temperature: 'ତାପମାତ୍ରା',
    humidity: 'ଆର୍ଦ୍ରତା',
    wind: 'ପବନ',
    visibility: 'ଦୃଶ୍ୟମାନତା',
    alerts: 'ଚେତାବନୀ',
    rainProbability: 'ବର୍ଷା ସମ୍ଭାବନା',
    feelsLike: 'ଅନୁଭୂତ ତାପମାତ୍ରା',
    uvIndex: 'ୟୁଭି ସୂଚକାଙ୍କ',
    pressure: 'ଚାପ',
    listening: 'ଶୁଣୁଛି...',
    processing: 'ପ୍ରକ୍ରିୟାକରଣ ଚାଲିଛି...',
    responding: 'WeatherGPT ଉତ୍ତର ଦେଉଛି...',
    playingResponse: 'ଉତ୍ତର ଶୁଣାଯାଉଛି...',
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  supportedLanguages: LanguageOption[];
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('weathergpt_preferred_language');
    return (saved as LanguageCode) || 'en';
  });
  const [supportedLanguages, setSupportedLanguages] = useState<LanguageOption[]>(DEFAULT_LANGUAGES);

  // Fetch supported languages dynamically from backend BHASHINI capabilities
  useEffect(() => {
    const fetchSupported = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/language/supported`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            const mapped: LanguageOption[] = json.data.map((l: any) => ({
              code: l.code as LanguageCode,
              name: l.name,
              nativeName: l.native_name || l.name,
              script: l.script,
            }));
            setSupportedLanguages(mapped);
          }
        }
      } catch (err) {
        console.log('[LanguageContext] Using fallback supported languages list.');
      }
    };
    fetchSupported();
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('weathergpt_preferred_language', lang);
      const savedProfile = localStorage.getItem('weathergpt_user_profile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed.id || parsed.user_id) {
            const uid = parsed.id || parsed.user_id;
            import('../services/profileService').then(({ profileService }) => {
              profileService.updateLanguage(uid, lang).catch(() => {});
            });
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  };

  const t = (key: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, supportedLanguages, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
