interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  subtitle?: string;
  onClick?: () => void;
}

export default function DashboardCard({ title, value, icon: Icon, color, subtitle, onClick }: DashboardCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-900 border border-blue-100 dark:bg-blue-900/50 dark:text-blue-100 dark:border-blue-800',
    green: 'bg-emerald-50 text-emerald-900 border border-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-100 dark:border-emerald-800',
    yellow: 'bg-amber-50 text-amber-900 border border-amber-100 dark:bg-amber-900/50 dark:text-amber-100 dark:border-amber-800',
    red: 'bg-rose-50 text-rose-900 border border-rose-100 dark:bg-rose-900/50 dark:text-rose-100 dark:border-rose-800',
    purple: 'bg-purple-50 text-purple-900 border border-purple-100 dark:bg-purple-900/50 dark:text-purple-100 dark:border-purple-800'
  };

  const valueColorClasses = {
    blue: 'text-blue-600 dark:text-blue-300',
    green: 'text-emerald-600 dark:text-emerald-300',
    yellow: 'text-amber-600 dark:text-amber-300',
    red: 'text-rose-600 dark:text-rose-300',
    purple: 'text-purple-600 dark:text-purple-300'
  };

  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-800/50 dark:text-blue-300',
    green: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800/50 dark:text-emerald-300',
    yellow: 'bg-amber-100 text-amber-600 dark:bg-amber-800/50 dark:text-amber-300',
    red: 'bg-rose-100 text-rose-600 dark:bg-rose-800/50 dark:text-rose-300',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-800/50 dark:text-purple-300'
  };

  return (
    <div 
      onClick={onClick}
      className={`p-6 rounded-xl shadow-md transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg transform hover:scale-105' : ''} ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium uppercase tracking-wide opacity-80">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${valueColorClasses[color]}`}>{value}</p>
          {subtitle && <p className="text-sm mt-1 opacity-70">{subtitle}</p>}
        </div>
        <div className={`${iconColorClasses[color]} p-3 rounded-lg`}>
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
