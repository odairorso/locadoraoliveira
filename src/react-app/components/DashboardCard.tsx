interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  subtitle?: string;
}

export default function DashboardCard({ title, value, icon: Icon, color, subtitle }: DashboardCardProps) {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200',
    green: 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-200',
    yellow: 'bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-yellow-200',
    red: 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-200',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-200',
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-100 text-sm font-medium opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-blue-100 text-sm mt-1 opacity-75">{subtitle}</p>}
        </div>
        <div className="bg-white bg-opacity-20 p-3 rounded-lg backdrop-blur-sm">
          <Icon className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
