import { useAppTheme } from '@/react-app/contexts/ThemeContext';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan';
  subtitle?: string;
  onClick?: () => void;
}

export default function DashboardCard({ title, value, icon: Icon, color, subtitle, onClick }: DashboardCardProps) {
  const { themeModel } = useAppTheme();
  const isGold = themeModel === 'gold_minimal';

  // Tema 1: Dourado Minimalista (Print 1)
  const goldStyles = {
    card: 'bg-[#121620] border-slate-800 text-white',
    badge: {
      yellow: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      green: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      red: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    }
  };

  // Tema 2: Colorido Vibrante (Print 2 Original)
  const vibrantStyles = {
    blue: 'bg-[#132347] border-[#224488]/80 text-white shadow-blue-950/40',
    green: 'bg-[#0a2e22] border-[#155e45]/80 text-white shadow-emerald-950/40',
    yellow: 'bg-[#2e1f0e] border-[#6b4515]/80 text-white shadow-amber-950/40',
    purple: 'bg-[#2a133d] border-[#5b2488]/80 text-white shadow-purple-950/40',
    cyan: 'bg-[#0e213d] border-[#1a4b88]/80 text-white shadow-cyan-950/40',
    red: 'bg-[#38111e] border-[#7d1c3a]/80 text-white shadow-rose-950/40'
  };

  const vibrantIconColors = {
    blue: 'text-blue-400 bg-blue-500/20 border-blue-400/40',
    green: 'text-emerald-400 bg-emerald-500/20 border-emerald-400/40',
    yellow: 'text-amber-400 bg-amber-500/20 border-amber-400/40',
    purple: 'text-purple-400 bg-purple-500/20 border-purple-400/40',
    cyan: 'text-cyan-400 bg-cyan-500/20 border-cyan-400/40',
    red: 'text-rose-400 bg-rose-500/20 border-rose-400/40'
  };

  if (isGold) {
    return (
      <div 
        onClick={onClick}
        className={`p-4 bg-[#121620] border border-slate-800 rounded-xl shadow-xl transition-all duration-200 ${
          onClick ? 'cursor-pointer hover:border-slate-700 active:scale-98' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight truncate">{value}</p>
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${goldStyles.badge[color]}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    );
  }

  // Renderização Colorida (Modelo 2 Original)
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-2xl border shadow-xl transition-all duration-200 ${vibrantStyles[color]} ${
        onClick ? 'cursor-pointer hover:scale-101 active:scale-98' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">{title}</p>
          <p className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight truncate">{value}</p>
          {subtitle && <p className="text-[11px] text-slate-300/80 mt-0.5">{subtitle}</p>}
        </div>

        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${vibrantIconColors[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
