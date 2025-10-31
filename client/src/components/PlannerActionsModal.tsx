import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, BarChart3, Map } from 'lucide-react';

interface PlannerActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: [number, number] | null;
  onAction: (action: string) => void;
}

export default function PlannerActionsModal({
  isOpen,
  onClose,
  location,
  onAction,
}: PlannerActionsModalProps) {
  const actions = [
    {
      id: 'urban-optimization',
      title: 'Urban Planning & Optimization',
      description: 'Get comprehensive infrastructure recommendations based on nearby zones, AQI, traffic, and land use data',
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'congestion-prediction',
      title: 'Traffic Congestion Prediction',
      description: 'Predict future traffic patterns and get recommendations for traffic management',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
    },
    {
      id: 'traffic-analysis',
      title: 'Real-time Traffic Analysis',
      description: 'Analyze current traffic conditions and identify bottlenecks',
      icon: BarChart3,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'zone-analysis',
      title: 'Zone & Land Use Analysis',
      description: 'Detailed analysis of land use patterns and zoning recommendations',
      icon: Map,
      color: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Planning Actions</DialogTitle>
          {location && (
            <p className="text-sm text-muted-foreground">
              Selected Location: {location[1].toFixed(4)}°N, {location[0].toFixed(4)}°E
            </p>
          )}
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onAction(action.id)}
              className="group relative p-4 rounded-lg border border-border bg-card hover:bg-accent transition-all duration-200 text-left overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
              <div className="relative flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color}`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}