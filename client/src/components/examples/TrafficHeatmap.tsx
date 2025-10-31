import TrafficHeatmap from '../TrafficHeatmap';

export default function TrafficHeatmapExample() {
  const mockData = {
    level: 'high' as const,
    percentage: 78,
    avgSpeed: 25,
    predictedCongestion: 85,
  };

  return (
    <div className="p-8 max-w-md">
      <TrafficHeatmap data={mockData} />
    </div>
  );
}
