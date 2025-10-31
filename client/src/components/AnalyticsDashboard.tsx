import { TrendingUp, TrendingDown, Building2, Trees, Factory, Construction } from 'lucide-react';

interface AnalyticsData {
  residential: number;
  commercial: number;
  industrial: number;
  green: number;
  construction: number;
  total: number;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData | null;
  isLoading: boolean;
}

export default function AnalyticsDashboard({ data, isLoading }: AnalyticsDashboardProps) {
  const formatArea = (sqm: number) => {
    if (sqm > 1000000) return `${(sqm / 1000000).toFixed(2)} km²`;
    return `${(sqm / 10000).toFixed(2)} ha`;
  };

  const metrics = data ? [
    {
      label: 'Residential',
      value: formatArea(data.residential),
      percentage: ((data.residential / data.total) * 100).toFixed(1),
      icon: Building2,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Commercial',
      value: formatArea(data.commercial),
      percentage: ((data.commercial / data.total) * 100).toFixed(1),
      icon: Building2,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Green Space',
      value: formatArea(data.green),
      percentage: ((data.green / data.total) * 100).toFixed(1),
      icon: Trees,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      trend: 'up',
    },
    {
      label: 'Industrial',
      value: formatArea(data.industrial),
      percentage: ((data.industrial / data.total) * 100).toFixed(1),
      icon: Factory,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Construction',
      value: formatArea(data.construction),
      percentage: ((data.construction / data.total) * 100).toFixed(1),
      icon: Construction,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      trend: 'down',
    },
  ] : [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Move the map to analyze the area</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-card border border-card-border rounded-lg p-4">
        <div className="text-sm text-muted-foreground mb-1">Total Area</div>
        <div className="text-2xl font-bold">{formatArea(data.total)}</div>
      </div>

      {metrics.map(metric => (
        <div
          key={metric.label}
          className="bg-card border border-card-border rounded-lg p-4 hover-elevate"
          data-testid={`metric-${metric.label.toLowerCase().replace(' ', '-')}`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className={`p-2 rounded-lg ${metric.bg}`}>
              <metric.icon className={`w-5 h-5 ${metric.color}`} />
            </div>
            {metric.trend && (
              <div className="flex items-center gap-1">
                {metric.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs text-muted-foreground">
                  {metric.percentage}%
                </span>
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground mb-1">{metric.label}</div>
          <div className="flex items-baseline justify-between">
            <div className="text-xl font-bold">{metric.value}</div>
            <div className="text-sm font-medium text-muted-foreground">
              {metric.percentage}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
