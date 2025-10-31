import { useState } from 'react';
import { X, MapPin, AlertCircle, Construction, Lightbulb, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: [number, number] | null;
  onSubmit: (report: {
    category: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    location: [number, number];
  }) => void;
}

const categories = [
  { id: 'pothole', label: 'Pothole', icon: AlertCircle, color: 'text-red-500' },
  { id: 'construction', label: 'Construction', icon: Construction, color: 'text-orange-500' },
  { id: 'park-idea', label: 'Park Idea', icon: Lightbulb, color: 'text-green-500' },
  { id: 'traffic', label: 'Traffic Issue', icon: AlertCircle, color: 'text-yellow-500' },
];

export default function ReportModal({ isOpen, onClose, location, onSubmit }: ReportModalProps) {
  const [category, setCategory] = useState('pothole');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  if (!isOpen || !location) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ category, description, priority, location });
    setDescription('');
    setCategory('pothole');
    setPriority('medium');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-card rounded-lg shadow-2xl border border-card-border">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-md hover-elevate z-10"
          data-testid="button-close-report"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pt-4">
          <h2 className="text-2xl font-bold mb-6">Submit Report</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="mb-3 block">Category</Label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-4 rounded-lg border-2 transition-all hover-elevate ${
                      category === cat.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                    data-testid={`button-category-${cat.id}`}
                  >
                    <cat.icon className={`w-6 h-6 ${cat.color} mx-auto mb-2`} />
                    <div className="text-sm font-medium">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the issue or suggestion..."
                className="mt-2 min-h-24"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="input-description"
                required
              />
            </div>

            <div>
              <Label className="mb-3 block">Priority</Label>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map(p => (
                  <Button
                    key={p}
                    type="button"
                    variant={priority === p ? 'default' : 'outline'}
                    onClick={() => setPriority(p as any)}
                    className="flex-1"
                    data-testid={`button-priority-${p}`}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
              <MapPin className="w-4 h-4" />
              <span>Location: {location[0].toFixed(4)}, {location[1].toFixed(4)}</span>
            </div>

            <Button type="submit" className="w-full" data-testid="button-submit-report">
              Submit Report
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
