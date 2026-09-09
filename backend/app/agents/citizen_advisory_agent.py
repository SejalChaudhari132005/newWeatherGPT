"""
CitizenAdvisoryAgent for WeatherGPT Step 9.
Generates deterministic, practical, actionable safety recommendations
for citizens under various meteorological hazard conditions.
"""

from typing import Dict, Any, List
from backend.app.core.alert_thresholds import AlertType, AlertSeverity


class CitizenAdvisoryAgent:
    """
    Generates tailored, safe, and practical advice for citizens.
    Follows Rule 26: Avoids overly confident or panic-inducing claims.
    """

    def generate_advisory(
        self,
        alert_type: str,
        severity: str,
        location_name: str,
        weather_params: Dict[str, Any],
        language: str = "en",
    ) -> Dict[str, Any]:
        """
        Synthesizes recommended actions, items to avoid, and safe guidance in the requested language.
        """
        norm_type = alert_type.upper()
        norm_sev = severity.upper()
        lang = (language or "en").lower()

        # English Defaults
        recommended_actions: List[str] = []
        what_to_avoid: List[str] = []

        if norm_type in [AlertType.HEAVY_RAIN.value, AlertType.EXTREME_RAIN.value, AlertType.RAIN.value]:
            if norm_sev in [AlertSeverity.SEVERE.value, AlertSeverity.EMERGENCY.value, AlertSeverity.WARNING.value]:
                if lang == "mr":
                    recommended_actions = [
                        "मजबूत छत्री किंवा रेनकोट सोबत ठेवा.",
                        "रस्त्यांवर पाणी साचण्याची शक्यता असल्याने प्रवासासाठी जास्तीचा वेळ ठेवा.",
                        "मुसळधार पावसाच्या वेळी शक्यतो घरातच राहा.",
                        "स्थानिक प्रशासनाच्या मार्गदर्शक सूचनांचे पालन करा.",
                    ]
                    what_to_avoid = [
                        "पाणी साचलेल्या पुलांवरून किंवा रस्त्यांवरून वाहन चालवणे टाळा.",
                        "जुनी झाडे किंवा कमकुवत इमारतींखाली उभे राहू नका.",
                        "विजेचे खांब किंवा पडलेल्या तारांना स्पर्श करू नका.",
                    ]
                elif lang == "hi":
                    recommended_actions = [
                        "मजबूत छाता या रेनकोट साथ रखें।",
                        "सड़कों पर जलभराव की संभावना को देखते हुए यात्रा के लिए अतिरिक्त समय लें।",
                        "भारी बारिश के दौरान घर के अंदर ही रहें।",
                        "स्थानीय प्रशासन के अलर्ट और निर्देशों का पालन करें।",
                    ]
                    what_to_avoid = [
                        "जलभराव वाले रास्तों या अंडरपास से वाहन न निकालें।",
                        "पुराने पेड़ों या कमजोर ढांचों के नीचे वाहन पार्क न करें।",
                        "बिजली के खंभों या लटकते तारों से दूर रहें।",
                    ]
                else:
                    recommended_actions = [
                        "Carry sturdy rain gear and an umbrella.",
                        "Allow extra travel time as water accumulation is likely on roads.",
                        "Stay indoors during periods of peak rainfall intensity.",
                        "Monitor local municipal updates for localized waterlogging.",
                    ]
                    what_to_avoid = [
                        "Avoid driving through submerged or waterlogged underpasses.",
                        "Do not park vehicles under old trees or unstable structures.",
                        "Avoid touching electrical poles or fallen power lines.",
                    ]
            else:
                if lang == "mr":
                    recommended_actions = [
                        "बाहेर पडताना छत्री सोबत ठेवा.",
                        "दैनंदिन प्रवासासाठी पावसापासून संरक्षणाची तयारी ठेवा.",
                    ]
                    what_to_avoid = [
                        "ओल्या रस्त्यांवर अचानक ब्रेक लावणे टाळा.",
                    ]
                elif lang == "hi":
                    recommended_actions = [
                        "घर से बाहर निकलते समय छाता साथ रखें।",
                        "दैनिक यात्रा के लिए हल्की बारिश से बचाव की तैयारी रखें।",
                    ]
                    what_to_avoid = [
                        "गीली सड़कों पर अचानक ब्रेक लगाने से बचें।",
                    ]
                else:
                    recommended_actions = [
                        "Carry an umbrella when going outdoors.",
                        "Keep light rain protection ready for daily commute.",
                    ]
                    what_to_avoid = [
                        "Avoid sudden braking on wet road surfaces.",
                    ]

        elif norm_type in [AlertType.THUNDERSTORM.value, AlertType.LIGHTNING.value]:
            if lang == "mr":
                recommended_actions = [
                    "पक्क्या इमारतीत किंवा सुरक्षित वाहनात आसरा घ्या.",
                    "विजांचा कडकडाट सुरू असताना संवेदनशील इलेक्ट्रॉनिक उपकरणे बंद ठेवा.",
                    "गडगडाट थांबल्यानंतर किमान ३० मिनिटे बाहेर पडणे टाळा.",
                ]
                what_to_avoid = [
                    "उंच किंवा एकाकी झाडांखाली आसरा घेऊ नका.",
                    "मोकळी मैदाने, टेकड्या आणि लोखंडी कुंपणाजवळ उभे राहू नका.",
                    "पाण्याचे साठे, पोहणे आणि खुल्या छतावर जाणे टाळा.",
                ]
            elif lang == "hi":
                recommended_actions = [
                    "पक्की इमारत या बंद वाहन में शरण लें।",
                    "आकाशीय बिजली के दौरान इलेक्ट्रॉनिक उपकरणों के प्लग निकाल दें।",
                    "गड़गड़ाहट बंद होने के 30 मिनट बाद तक बाहर न निकलें।",
                ]
                what_to_avoid = [
                    "अकेले या ऊंचे पेड़ों के नीचे बिल्कुल न खड़े हों।",
                    "खुले मैदानों, पहाड़ियों और धातु की बाड़ों से दूर रहें।",
                    "जलाशयों और खुली छतों पर जाने से बचें।",
                ]
            else:
                recommended_actions = [
                    "Seek shelter in a sturdy building or fully enclosed vehicle.",
                    "Unplug sensitive electronic appliances during intense lightning.",
                    "Wait at least 30 minutes after the last thunderclap before resuming outdoor activities.",
                ]
                what_to_avoid = [
                    "Do NOT take shelter under isolated tall trees.",
                    "Avoid open fields, hilltops, and metal fences.",
                    "Avoid water bodies, swimming, and open rooftop areas.",
                ]

        elif norm_type in [AlertType.HEATWAVE.value, AlertType.EXTREME_TEMPERATURE.value]:
            if lang == "mr":
                recommended_actions = [
                    "तहान नसली तरीही नियमित पुरेसे पाणी प्या.",
                    "हलके, सैल आणि सुती कपडे परिधान करा.",
                    "उन्हात बाहेर पडताना छत्री, टोपी किंवा ओल्या रुमालाने डोके झाका.",
                    "ओआरएस, नारळपाणी किंवा लिंबू पाणी सोबत ठेवा.",
                ]
                what_to_avoid = [
                    "दुपारी १२:०० ते ३:३० दरम्यान कष्टाची कामे करणे टाळा.",
                    "बंद वाहनात लहान मुले किंवा पाळीव प्राण्यांना सोडू नका.",
                    "चहा, कॉफी किंवा अति गोड पेये जास्त प्रमाणात पिणे टाळा.",
                ]
            elif lang == "hi":
                recommended_actions = [
                    "प्यास न लगे तब भी नियमित रूप से पर्याप्त पानी पिएं।",
                    "हल्के, ढीले और सूती कपड़े पहनें।",
                    "धूप में निकलते समय छाता, टोपी या सूती कपड़े से सिर ढकें।",
                    "ओआरएस, नींबू पानी या नारियल पानी का सेवन करें।",
                ]
                what_to_avoid = [
                    "दोपहर 12:00 से 3:30 के बीच भारी धूप में परिश्रम से बचें।",
                    "बंद गाड़ियों में बच्चों या पालतू जानवरों को न छोड़ें।",
                    "अधिक चाय, कॉफी या निर्जलीकरण करने वाले पेयों से बचें।",
                ]
            else:
                recommended_actions = [
                    "Drink sufficient water regularly, even if not feeling thirsty.",
                    "Wear lightweight, loose-fitting, light-colored cotton clothes.",
                    "Use an umbrella, hat, or damp cloth to cover your head when stepping out.",
                    "Keep ORS, coconut water, or homemade lassi/lemon water handy.",
                ]
                what_to_avoid = [
                    "Avoid strenuous outdoor activities between 12:00 PM and 3:30 PM.",
                    "Do not leave children or pets inside parked vehicles.",
                    "Avoid alcohol, carbonated drinks, and excessive tea/coffee which can dehydrate.",
                ]

        elif norm_type in [AlertType.STRONG_WIND.value, AlertType.EXTREME_WIND.value, AlertType.CYCLONE.value]:
            if lang == "mr":
                recommended_actions = [
                    "घराबाहेरील मोकळ्या वस्तू, कुंड्या घरात सुरक्षित ठेवा.",
                    "खिडक्या आणि दारे व्यवस्थित बंद करा.",
                    "दुचाकी चालवताना वेग मर्यादित ठेवा आणि काळजी घ्या.",
                ]
                what_to_avoid = [
                    "मोठे होर्डिंग्ज, पत्र्यांचे शेड किंवा जुन्या झाडांखाली थांबू नका.",
                    "वादळी वाऱ्याच्या वेळी समुद्रकिनारी जाणे टाळा.",
                ]
            elif lang == "hi":
                recommended_actions = [
                    "खुली और ढीली वस्तुओं, गमलों को सुरक्षित स्थान पर रखें।",
                    "खिड़कियों और दरवाजों को ठीक से बंद रखें।",
                    "दोपहिया वाहन चालक गति धीमी रखें और सावधानी बरतें।",
                ]
                what_to_avoid = [
                    "बड़े होर्डिंग, टिन शेड या कमजोर पेड़ों के पास खड़े न हों।",
                    "तेज हवाओं के दौरान तटीय क्षेत्रों या नदी किनारों से दूर रहें।",
                ]
            else:
                recommended_actions = [
                    "Secure or bring indoors loose items, pots, and outdoor furniture.",
                    "Fasten windows and doors securely.",
                    "Two-wheeler riders should drive with extra caution and reduce speed.",
                ]
                what_to_avoid = [
                    "Avoid standing or parking near large hoardings, tin sheds, or old trees.",
                    "Avoid coastal or waterfront promenades during high winds.",
                ]

        elif norm_type in [AlertType.POOR_VISIBILITY.value, AlertType.FOG.value]:
            if lang == "mr":
                recommended_actions = [
                    "कमी वेगाने आणि फॉग लॅम्प चालू ठेवून वाहन चालवा.",
                    "पुढील वाहनापासून सुरक्षित अंतर ठेवा.",
                    "रस्त्यावरील पांढऱ्या पट्ट्यांचे मार्गदर्शन घ्या.",
                ]
                what_to_avoid = [
                    "दाट धुक्यात हाय-बीम लाईट वापरू नका.",
                    "कमी दृश्यमानतेत अचानक थांबणे किंवा ओव्हरटेक करणे टाळा.",
                ]
            elif lang == "hi":
                recommended_actions = [
                    "धीमी गति और फॉग लैंप के साथ वाहन चलाएं।",
                    "आगे वाले वाहन से सुरक्षित दूरी बनाए रखें।",
                    "सड़क की लेन मार्किंग का ध्यान रखें।",
                ]
                what_to_avoid = [
                    "घने कोहरे में हाई-बीम हेडलाइट का प्रयोग न करें।",
                    "शून्य दृश्यता में अचानक ओवरटेक करने से बचें।",
                ]
            else:
                recommended_actions = [
                    "Drive at reduced speeds using low-beam headlights and fog lamps.",
                    "Maintain a generous following distance behind other vehicles.",
                    "Use lane markings and roadside reflective indicators as visual guides.",
                ]
                what_to_avoid = [
                    "Do NOT use high-beam headlights in dense fog (it reflects light back).",
                    "Avoid abrupt stops or overtaking in zero-visibility zones.",
                ]

        elif norm_type == AlertType.FLOOD_RISK.value:
            if lang == "mr":
                recommended_actions = [
                    "महत्त्वाच्या वस्तू आणि कागदपत्रे वरच्या मजल्यावर हलवा.",
                    "स्थानिक आपत्ती व्यवस्थापन प्राधिकरणाच्या सूचनांचे काटेकोर पालन करा.",
                    "टॉर्च, पिण्याचे पाणी आणि प्रथमोपचार पेटी तयार ठेवा.",
                ]
                what_to_avoid = [
                    "पुराच्या वाहत्या पाण्यातून चालणे, पोहणे किंवा वाहन चालवणे टाळा.",
                    "गटारे आणि उघड्या नाल्यांपासून दूर राहा.",
                ]
            elif lang == "hi":
                recommended_actions = [
                    "महत्वपूर्ण दस्तावेज और कीमती सामान ऊपरी मंजिल पर रखें।",
                    "स्थानीय आपदा प्रबंधन प्राधिकरण के निर्देशों का पालन करें।",
                    "आपातकालीन टॉर्च, पीने का पानी और प्राथमिक चिकित्सा किट तैयार रखें।",
                ]
                what_to_avoid = [
                    "बाढ़ के बहते पानी में चलने, तैरने या गाड़ी चलाने की कोशिश न करें।",
                    "नालों और गहरे पानी के बहाव से दूर रहें।",
                ]
            else:
                recommended_actions = [
                    "Move essential valuables and documents to higher floor levels.",
                    "Follow official instructions from local disaster management authorities.",
                    "Keep emergency torches, bottled water, and first aid kits accessible.",
                ]
                what_to_avoid = [
                    "Never attempt to walk, swim, or drive through flowing floodwaters.",
                    "Avoid storm drains and culverts.",
                ]

        else:
            if lang == "mr":
                recommended_actions = [
                    "WeatherGPT वरील हवामान अपडेट्स तपासा.",
                    "स्थानिक प्रशासनाच्या हवामान मार्गदर्शकांचे पालन करा.",
                ]
                what_to_avoid = [
                    "प्रतिकूल हवामानात विनाकारण बाहेर पडणे टाळा.",
                ]
            elif lang == "hi":
                recommended_actions = [
                    "WeatherGPT पर मौसम के अपडेट्स देखते रहें।",
                    "स्थानीय मौसम दिशानिर्देशों का पालन करें।",
                ]
                what_to_avoid = [
                    "खराब मौसम में अनावश्यक बाहर निकलने से बचें।",
                ]
            else:
                recommended_actions = [
                    "Stay updated with real-time WeatherGPT alerts.",
                    "Follow official local municipal weather guidelines.",
                ]
                what_to_avoid = [
                    "Avoid unnecessary exposure to harsh outdoor elements.",
                ]

        return {
            "recommended_actions": recommended_actions,
            "what_to_avoid": what_to_avoid,
        }


citizen_advisory_agent = CitizenAdvisoryAgent()
