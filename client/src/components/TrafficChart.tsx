import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function TrafficChart({data}: {data: any}) {
  const chartData = [
    { label: "Free Flow", value: data.freeFlowSpeed || 55 },
    { label: "Current", value: data.currentSpeed || 35 },
    { label: "Predicted", value: data.congestionPercentage || 70 },
  ];

  return (
    <div className="bg-white rounded-xl p-3 shadow-md border w-[300px]">
      <h3 className="text-sm font-semibold mb-2">Traffic Flow Snapshot</h3>
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" fontSize={10} />
          <YAxis fontSize={10} />
          <Tooltip />
          <Line type="monotone" dataKey="value" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
