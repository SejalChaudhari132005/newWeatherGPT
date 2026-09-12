import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Wind, CloudRain, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { SprayingRiskAssessment } from '../../../types/farmerIntelligence';
import { useLanguage } from '../../../context/LanguageContext';
import { translateCrop, translatePhrase } from '../../../utils/dashboardTranslator';

interface SprayingRiskCardProps {
  assessment: SprayingRiskAssessment;
  cropName: string;
}

export const SprayingRiskCard: React.FC<SprayingRiskCardProps> = ({ assessment, cropName }) => {
  const { language } = useLanguage();

  const getBadgeConfig = () => {
    switch (assessment.overall_risk) {
      case 'LOW':
        return {
          bg: 'bg-emerald-50 border-emerald-300/80',
          heroBadge: 'bg-emerald-600 text-white',
          title: `🟢 ${translatePhrase('safeToSpray', language)}`,
          subtitle:
            language === 'mr'
              ? 'हवामान अनुकूल आहे, औषध वाहून जाण्याची अथवा उडून जाण्याची जोखीम नाही.'
              : language === 'hi'
              ? 'मौसम अनुकूल है, कीटनाशक बहने या उड़ने का कोई जोखिम नहीं है।'
              : 'Weather conditions are optimal with minimum drift and zero wash-off risk.',
          icon: <ShieldCheck className="w-7 h-7 text-emerald-600" />,
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-50 border-amber-300/80',
          heroBadge: 'bg-amber-500 text-white',
          title: `🟡 ${translatePhrase('cautionSpray', language)}`,
          subtitle:
            language === 'mr'
              ? 'मध्यम वाऱ्याचा वेग किंवा हलक्या पावसाची शक्यता. काळजीपूर्वक फवारणी करा.'
              : language === 'hi'
              ? 'मध्यम हवा या हल्की बारिश की संभावना। सावधानीपूर्वक छिड़काव करें।'
              : 'Moderate wind drift or scattered rain risk. Follow rainfast instructions.',
          icon: <ShieldAlert className="w-7 h-7 text-amber-600" />,
        };
      case 'HIGH':
      default:
        return {
          bg: 'bg-rose-50 border-rose-300/80',
          heroBadge: 'bg-rose-600 text-white',
          title: `🔴 ${translatePhrase('postponeSpray', language)}`,
          subtitle:
            language === 'mr'
              ? 'अतिवृष्टी किंवा सोसाट्याचा वारा असल्याने फवारणी व्यर्थ जाईल. काम पुढे ढकला.'
              : language === 'hi'
              ? 'भारी बारिश या तेज हवा के कारण छिड़काव बेकार हो जाएगा। काम स्थगित करें।'
              : 'Severe wash-off or drift hazard. Application will waste chemicals.',
          icon: <ShieldX className="w-7 h-7 text-rose-600" />,
        };
    }
  };

  const config = getBadgeConfig();
  const riskLevelTranslated =
    assessment.overall_risk === 'LOW'
      ? translatePhrase('low', language)
      : assessment.overall_risk === 'MODERATE'
      ? translatePhrase('moderate', language)
      : translatePhrase('high', language);

  return (
    <div className={`rounded-3xl p-4 sm:p-5 border shadow-sm transition-all ${config.bg} space-y-3.5`}>
      {/* Header with Risk Badge */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2.5 bg-white rounded-2xl shadow-xs border border-slate-100 shrink-0">
              {config.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${config.heroBadge}`}>
                  {riskLevelTranslated}
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {translatePhrase('sprayingDecision', language)}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mt-0.5 leading-tight">{config.title}</h3>
            </div>
          </div>
        </div>

        {assessment.optimal_window && (
          <div className="bg-white/95 px-3 py-2 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              {translatePhrase('optimalWindow', language)}
            </span>
            <div className="text-xs font-black text-emerald-800 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{assessment.optimal_window}</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-700 font-medium leading-relaxed">
        {config.subtitle}
      </p>

      {/* Metrics breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Wash-Off Risk */}
        <div className="p-3 bg-white/95 rounded-2xl border border-slate-200/70 space-y-1">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 min-w-0">
              <CloudRain className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="truncate">{translatePhrase('washOff', language)}</span>
            </div>
            <span
              className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                assessment.wash_off_risk === 'HIGH'
                  ? 'bg-rose-100 text-rose-700'
                  : assessment.wash_off_risk === 'MODERATE'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {assessment.wash_off_risk === 'LOW'
                ? translatePhrase('low', language)
                : assessment.wash_off_risk === 'MODERATE'
                ? translatePhrase('moderate', language)
                : translatePhrase('high', language)}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-normal leading-tight">
            {assessment.wash_off_risk === 'HIGH'
              ? language === 'mr' ? 'फवारणीनंतर लगेच पाऊस अपेक्षित आहे (< 4 तास).' : language === 'hi' ? 'छिड़काव के तुरंत बाद बारिश की संभावना है (< 4 घंटे)।' : 'Rain expected shortly after application (< 4 hrs).'
              : assessment.wash_off_risk === 'MODERATE'
              ? language === 'mr' ? 'पावसाची थोडी शक्यता. सिलिकॉन स्टिकर वापरावे.' : language === 'hi' ? 'बारिश की हल्की संभावना। सिलिकॉन स्टीकर का उपयोग करें।' : 'Isolated chance of rain. Add silicon adjuvant.'
              : language === 'mr' ? 'फवारणीनंतर पाऊस पडण्याची शक्यता नाही.' : language === 'hi' ? 'छिड़काव के बाद बारिश की संभावना नहीं है।' : 'Zero significant rainfall forecast post-application.'}
          </p>
        </div>

        {/* Drift Risk */}
        <div className="p-3 bg-white/95 rounded-2xl border border-slate-200/70 space-y-1">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 min-w-0">
              <Wind className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="truncate">{translatePhrase('windDrift', language)}</span>
            </div>
            <span
              className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                assessment.drift_risk === 'HIGH'
                  ? 'bg-rose-100 text-rose-700'
                  : assessment.drift_risk === 'MODERATE'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {assessment.drift_risk === 'LOW'
                ? translatePhrase('low', language)
                : assessment.drift_risk === 'MODERATE'
                ? translatePhrase('moderate', language)
                : translatePhrase('high', language)} ({assessment.wind_speed_kmh} km/h)
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-normal leading-tight">
            {assessment.drift_risk === 'HIGH'
              ? language === 'mr' ? 'जास्त वाऱ्याचा वेग (>15 km/h) औषध उडवून नेईल.' : language === 'hi' ? 'तेज हवा (>15 km/h) से दवा उड़ जाएगी।' : 'High wind velocity (>15 km/h) causes off-target drift.'
              : assessment.drift_risk === 'MODERATE'
              ? language === 'mr' ? 'मध्यम वारा. स्प्रे नोझल जवळ ठेवा.' : language === 'hi' ? 'मध्यम हवा। स्प्रे नोजल पास रखें।' : 'Breezy winds. Lower spray boom height.'
              : language === 'mr' ? 'शांत वारा (<10 km/h) अचूक फवारणीसाठी उत्तम.' : language === 'hi' ? 'शांत हवा (<10 km/h) सटीक छिड़काव के लिए उपयुक्त।' : 'Calm morning winds (<10 km/h) ensure precise target coverage.'}
          </p>
        </div>
      </div>

      {/* Actionable recommendations */}
      {assessment.recommendations && assessment.recommendations.length > 0 && (
        <div className="bg-white/95 p-3.5 rounded-2xl border border-slate-200/70 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {language === 'mr'
                ? `${translateCrop(cropName, language)} पिकासाठी शिफारसी:`
                : language === 'hi'
                ? `${translateCrop(cropName, language)} फसल के लिए सुझाव:`
                : `Recommendations for ${translateCrop(cropName, language)}:`}
            </span>
          </div>
          <ul className="space-y-1">
            {assessment.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-700 leading-relaxed">
                <span className="text-emerald-600 font-black shrink-0">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

