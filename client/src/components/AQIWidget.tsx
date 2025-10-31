import { Wind, TrendingUp, TrendingDown } from 'lucide-react';

interface AQIWidgetProps {
  value: number;
  trend?: 'up' | 'down';
  location?: string;
}

export default function AQIWidget({ value, trend, location }: AQIWidgetProps) {
  const getAQICategory = (aqi: number) => {
    if (aqi <= 50) return { label: 'Good', color: 'text-green-500', bg: 'bg-green-500' };
    if (aqi <= 100) return { label: 'Moderate', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: 'text-orange-500', bg: 'bg-orange-500' };
    if (aqi <= 200) return { label: 'Unhealthy', color: 'text-red-500', bg: 'bg-red-500' };
    if (aqi <= 300) return { label: 'Very Unhealthy', color: 'text-purple-500', bg: 'bg-purple-500' };
    return { label: 'Hazardous', color: 'text-red-700', bg: 'bg-red-700' };
  };

  const category = getAQICategory(value);
  const percentage = Math.min((value / 300) * 100, 100);

  return (
    <div className="bg-card border border-card-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Air Quality Index</h3>
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-red-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-green-500" />
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${percentage * 2.513} ${251.3 - percentage * 2.513}`}
              className={category.color}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-3xl font-bold ${category.color}`}>{value}</div>
            <div className="text-xs text-muted-foreground">AQI</div>
          </div>
        </div>

        <div className="flex-1">
          <div className={`text-lg font-semibold ${category.color} mb-1`}>
            {category.label}
          </div>
          {location && (
            <div className="text-sm text-muted-foreground mb-3">{location}</div>
          )}
          <div className="text-xs text-muted-foreground">
            {value <= 50 && 'Air quality is satisfactory, and air pollution poses little or no risk.'}
            {value > 50 && value <= 100 && 'Air quality is acceptable for most individuals.'}
            {value > 100 && value <= 150 && 'Sensitive groups may experience health effects.'}
            {value > 150 && 'Everyone may begin to experience health effects.'}
          </div>
        </div>
      </div>
    </div>
  );
}
