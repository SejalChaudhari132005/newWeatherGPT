export interface RoleTheme {
  role: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  lightBg: string;
  cardBorder: string;
  iconBg: string;
  badgeBg: string;
  badgeText: string;
  heroOverlay: string;
  themeClass: string;
}

export const ROLE_THEMES: Record<string, RoleTheme> = {
  citizen: {
    role: 'citizen',
    name: 'Citizen',
    primaryColor: '#004aad',
    secondaryColor: '#38b6ff',
    accentColor: '#fcd444',
    lightBg: '#F4F7FC',
    cardBorder: 'border-slate-200',
    iconBg: 'bg-blue-50 text-[#004aad]',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    heroOverlay: 'from-slate-900/80 via-slate-900/40 to-transparent',
    themeClass: 'theme-citizen',
  },
  farmer: {
    role: 'farmer',
    name: 'Farmer / Agriculture',
    primaryColor: '#16a34a',
    secondaryColor: '#22c55e',
    accentColor: '#eab308',
    lightBg: '#F3FAF5',
    cardBorder: 'border-emerald-200/80',
    iconBg: 'bg-emerald-50 text-emerald-700',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    heroOverlay: 'from-black/80 via-black/40 to-black/10',
    themeClass: 'theme-farmer',
  },
  fisher: {
    role: 'fisher',
    name: 'Fisherman / Marine',
    primaryColor: '#0d9488',
    secondaryColor: '#14b8a6',
    accentColor: '#38bdf8',
    lightBg: '#F0FDFB',
    cardBorder: 'border-teal-200/80',
    iconBg: 'bg-teal-50 text-teal-700',
    badgeBg: 'bg-teal-100',
    badgeText: 'text-teal-800',
    heroOverlay: 'from-slate-950/80 via-slate-900/40 to-transparent',
    themeClass: 'theme-fisher',
  },
  aviation: {
    role: 'aviation',
    name: 'Aviation / Pilot',
    primaryColor: '#d97706',
    secondaryColor: '#f59e0b',
    accentColor: '#6366f1',
    lightBg: '#FFFBEB',
    cardBorder: 'border-amber-200/80',
    iconBg: 'bg-amber-50 text-amber-700',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    heroOverlay: 'from-slate-950/80 via-slate-900/40 to-transparent',
    themeClass: 'theme-aviation',
  },
  disaster_manager: {
    role: 'disaster_manager',
    name: 'Disaster Management',
    primaryColor: '#dc2626',
    secondaryColor: '#ea580c',
    accentColor: '#fbbf24',
    lightBg: '#FEF2F2',
    cardBorder: 'border-rose-200/80',
    iconBg: 'bg-rose-50 text-rose-700',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    heroOverlay: 'from-slate-950/85 via-slate-900/50 to-transparent',
    themeClass: 'theme-disaster',
  },
  urban_planner: {
    role: 'urban_planner',
    name: 'Urban Planner',
    primaryColor: '#9333ea',
    secondaryColor: '#a855f7',
    accentColor: '#06b6d4',
    lightBg: '#FAF5FF',
    cardBorder: 'border-purple-200/80',
    iconBg: 'bg-purple-50 text-purple-700',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    heroOverlay: 'from-slate-950/80 via-slate-900/40 to-transparent',
    themeClass: 'theme-urban',
  },
  researcher: {
    role: 'researcher',
    name: 'Researcher / Academic',
    primaryColor: '#4f46e5',
    secondaryColor: '#6366f1',
    accentColor: '#10b981',
    lightBg: '#EEF2FF',
    cardBorder: 'border-indigo-200/80',
    iconBg: 'bg-indigo-50 text-indigo-700',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    heroOverlay: 'from-slate-950/80 via-slate-900/40 to-transparent',
    themeClass: 'theme-researcher',
  },
};

export const getRoleTheme = (role?: string): RoleTheme => {
  const key = (role || 'citizen').toLowerCase();
  return ROLE_THEMES[key] || ROLE_THEMES.citizen;
};
