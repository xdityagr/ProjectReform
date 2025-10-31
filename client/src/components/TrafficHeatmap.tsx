// Component Developed By Aditya Gaur, 2025

import { Activity, Clock } from 'lucide-react';

interface TrafficData {
  level: 'low' | 'medium' | 'high' | 'severe';
  percentage: number;
  avgSpeed: number;
  predictedCongestion: number;
}

interface TrafficHeatmapProps {
  data: TrafficData;
}

export default function TrafficHeatmap({ data }: TrafficHeatmapProps) {
  const getTrafficColor = (level: string) => {
    switch (level) {
      case 'low': return { bg: 'bg-green-500', text: 'text-green-500', label: 'Light Traffic' };
      case 'medium': return { bg: 'bg-yellow-500', text: 'text-yellow-500', label: 'Moderate Traffic' };
      case 'high': return { bg: 'bg-orange-500', text: 'text-orange-500', label: 'Heavy Traffic' };
      case 'severe': return { bg: 'bg-red-500', text: 'text-red-500', label: 'Severe Congestion' };
      default: return { bg: 'bg-gray-500', text: 'text-gray-500', label: 'Unknown' };
    }
  };

  const colors = getTrafficColor(data.level);

  return (
    <div className="bg-card border border-card-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold">Live Traffic Analysis</h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-lg font-semibold ${colors.text}`}>
              {colors.label}
            </span>
            <span className="text-sm text-muted-foreground">
              {data.percentage}% capacity
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${colors.bg} transition-all duration-500`}
              style={{ width: `${data.percentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1">Avg Speed</div>
            <div className="text-xl font-bold">{data.avgSpeed} km/h</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Predicted +30min
            </div>
            <div className="text-xl font-bold">{data.predictedCongestion}%</div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {data.level === 'severe' && '⚠️ Consider alternative routes or delay travel if possible.'}
          {data.level === 'high' && '🟡 Expect delays during peak hours.'}
          {data.level === 'medium' && '✓ Traffic is flowing steadily with minor delays.'}
          {data.level === 'low' && '✓ Optimal conditions for travel.'}
        </div>
      </div>
    </div>
  );
}
