import React from 'react';
import { Volume2, VolumeX, Loader2, Sparkles } from 'lucide-react';
import { useLanguage, LanguageCode } from '../../../context/LanguageContext';
import { useVoice } from '../../../hooks/useVoice';

interface RegionalVoiceBriefingCardProps {
  advisoryText?: string;
  cropName?: string;
}

export const RegionalVoiceBriefingCard: React.FC<RegionalVoiceBriefingCardProps> = ({
  advisoryText,
  cropName = 'Rice / Paddy',
}) => {
  const { language, setLanguage } = useLanguage();
  const { speakText, isSpeaking, stopSpeaking } = useVoice();

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    const defaultBriefing =
      language === 'mr'
        ? `आपल्या शेतातील मातीतील ओलावा पुरेसा आहे. पुढील २४ तासांत सिंचनाची गरज नाही. हवामान पिकासाठी अनुकूल आहे.`
        : language === 'hi'
        ? `आपके खेत की मिट्टी में पर्याप्त नमी है। अगले २४ घंटों में सिंचाई की आवश्यकता नहीं है। मौसम फसल के लिए अनुकूल है।`
        : language === 'gu'
        ? `તમારા ખેતરની જમીનમાં પૂરતો ભેજ છે. આગામી ૨૪ કલાકમાં સિંચાઈની જરૂર નથી. હવામાન પાક માટે અનુકૂળ છે.`
        : `Your soil moisture is adequate. No immediate irrigation is required for the next 24 hours. Weather is favorable for your crop.`;

    const textToSpeak = advisoryText || defaultBriefing;
    speakText(textToSpeak, language);
  };

  return (
    <div className="w-full bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 rounded-3xl p-4 sm:p-5 text-white shadow-lg space-y-3.5 border border-emerald-700/50">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md text-emerald-200 flex items-center justify-center border border-white/20 shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
              {language === 'mr' ? 'प्रादेशिक आवाज बुलेटिन' : language === 'hi' ? 'क्षेत्रीय ध्वनि बुलेटिन' : 'Regional Voice Briefing'}
            </h3>
            <p className="text-[11px] text-emerald-200 font-semibold">
              {language === 'mr' ? 'आपल्या भाषेत कृषी सल्ला ऐका' : language === 'hi' ? 'अपनी भाषा में कृषि सलाह सुनें' : 'Listen to farm advisory in your language'}
            </p>
          </div>
        </div>

        {/* Bhashini AI Powered Pill */}
        <div className="px-2 py-0.5 rounded-full bg-emerald-700/60 border border-emerald-500/50 text-[10px] font-black text-emerald-200 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-300" />
          <span>Bhashini</span>
        </div>
      </div>

      {/* Language Buttons & Play Bar */}
      <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
        {/* Language selector chips */}
        <div className="inline-flex rounded-2xl bg-black/30 p-1 border border-white/15">
          {(['en', 'mr', 'hi', 'gu'] as LanguageCode[]).map((code) => {
            const labels: Record<string, string> = {
              en: 'English',
              mr: 'मराठी',
              hi: 'हिंदी',
              gu: 'ગુજરાતી',
            };

            const isSelected = language === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {labels[code]}
              </button>
            );
          })}
        </div>

        {/* Listen Action Button */}
        <button
          type="button"
          onClick={handleSpeak}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md active:scale-95 ${
            isSpeaking
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 animate-pulse'
              : 'bg-white hover:bg-slate-100 text-emerald-950'
          }`}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-4 h-4" />
              <span>{language === 'mr' ? 'थांबवा' : language === 'hi' ? 'रोकें' : 'Stop'}</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-700" />
              <span>{language === 'mr' ? '🔊 ऐका' : language === 'hi' ? '🔊 सुनें' : '🔊 Listen'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
