import AnalyticsDashboard from '../AnalyticsDashboard';

export default function AnalyticsDashboardExample() {
  const mockData = {
    residential: 2500000,
    commercial: 800000,
    industrial: 600000,
    green: 1200000,
    construction: 300000,
    total: 5400000,
  };

  return (
    <div className="p-8 max-w-md">
      <h2 className="text-xl font-bold mb-4">Area Analytics</h2>
      <AnalyticsDashboard data={mockData} isLoading={false} />
    </div>
  );
}
