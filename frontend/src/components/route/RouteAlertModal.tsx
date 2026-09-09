import React, { useState } from 'react';
import { Bell, X, Check, ShieldAlert, Loader2 } from 'lucide-react';
import { routeService } from '../../services/routeService';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  originName: string;
  destinationName: string;
  userId?: string;
}

export const RouteAlertModal: React.FC<Props> = ({
  isOpen,
  onClose,
  originName,
  destinationName,
  userId = 'anonymous',
}) => {
  const { language } = useLanguage();
  const [alertOnRain, setAlertOnRain] = useState(true);
  const [alertOnThunder, setAlertOnThunder] = useState(true);
  const [alertOnFog, setAlertOnFog] = useState(true);
  const [alertOnSevere, setAlertOnSevere] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await routeService.setRouteAlert({
        user_id: userId,
        origin_name: originName,
        destination_name: destinationName,
        alert_on_rain: alertOnRain,
        alert_on_thunderstorm: alertOnThunder,
        alert_on_fog: alertOnFog,
        alert_on_severe: alertOnSevere,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to set route alert:', err);
    } finally {
      setSaving(false);
    }
  };

  const labels = {
    title: language === 'mr' ? 'प्रवास हवामान चेतावणी सबस्क्रिप्शन' : language === 'hi' ? 'यात्रा मौसम चेतावनी सदस्यता' : 'Set Route Weather Alert',
    subtitle: language === 'mr' ? `${originName} → ${destinationName} मार्गावर तीव्र हवामान आढळल्यास सूचना मिळवा` : language === 'hi' ? `${originName} → ${destinationName} मार्ग पर गंभीर मौसम होने पर अलर्ट पाएं` : `Notify me if severe weather develops along ${originName} → ${destinationName}`,
    rain: language === 'mr' ? 'मुसळधार पाऊस व पाणी साचणे' : language === 'hi' ? 'भारी बारिश और जलभराव' : 'Heavy Rain & Flooding',
    thunder: language === 'mr' ? 'वादळ आणि वीज पडणे' : language === 'hi' ? 'आंधी और बिजली' : 'Thunderstorms & Lightning',
    fog: language === 'mr' ? 'दाट धुके व कमी दृश्यमानता' : language === 'hi' ? 'घना कोहरा और कम दृश्यता' : 'Dense Fog & Low Visibility',
    severe: language === 'mr' ? 'अधिकृत IMD रेड / ऑरेंज अलर्ट' : language === 'hi' ? 'आधिकारिक IMD रेड/ऑरेंज अलर्ट' : 'Official IMD Red / Orange Warnings',
    saveBtn: language === 'mr' ? 'चेतावणी सेट करा' : language === 'hi' ? 'अलर्ट सेट करें' : 'Set Travel Alert',
    saved: language === 'mr' ? '✓ चेतावणी यशस्वीरित्या सेट केली!' : language === 'hi' ? '✓ अलर्ट सफलतापूर्वक सेट किया गया!' : '✓ Travel Alert Set Successfully!',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-['Arimo']">
      <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-200">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{labels.title}</h3>
              <p className="text-[11px] text-slate-500 font-semibold">{labels.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Checkbox Options */}
        <div className="space-y-2.5 pt-2">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-blue-50/50">
            <span className="text-xs font-bold text-slate-800">{labels.severe}</span>
            <input
              type="checkbox"
              checked={alertOnSevere}
              onChange={(e) => setAlertOnSevere(e.target.checked)}
              className="w-4 h-4 text-[#004aad] rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-blue-50/50">
            <span className="text-xs font-bold text-slate-800">{labels.rain}</span>
            <input
              type="checkbox"
              checked={alertOnRain}
              onChange={(e) => setAlertOnRain(e.target.checked)}
              className="w-4 h-4 text-[#004aad] rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-blue-50/50">
            <span className="text-xs font-bold text-slate-800">{labels.thunder}</span>
            <input
              type="checkbox"
              checked={alertOnThunder}
              onChange={(e) => setAlertOnThunder(e.target.checked)}
              className="w-4 h-4 text-[#004aad] rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-blue-50/50">
            <span className="text-xs font-bold text-slate-800">{labels.fog}</span>
            <input
              type="checkbox"
              checked={alertOnFog}
              onChange={(e) => setAlertOnFog(e.target.checked)}
              className="w-4 h-4 text-[#004aad] rounded"
            />
          </label>
        </div>

        {/* Submit */}
        <button
          onClick={handleSave}
          disabled={saving || savedSuccess}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#004aad] to-[#38b6ff] hover:opacity-95 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : savedSuccess ? (
            <span>{labels.saved}</span>
          ) : (
            <>
              <Bell className="w-4 h-4" />
              <span>{labels.saveBtn}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
