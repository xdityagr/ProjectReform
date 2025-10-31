import { useState } from 'react';
import { Search, MapPin, Hash, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type SearchMode = 'location' | 'address' | 'coordinates' | 'area-type';

interface AdvancedSearchBarProps {
  onSearch: (query: string, mode: SearchMode, filters: string[]) => void;
}

export default function AdvancedSearchBar({ onSearch }: AdvancedSearchBarProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('location');
  const [filters, setFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const modes: { value: SearchMode; label: string; icon: any }[] = [
    { value: 'location', label: 'Location', icon: MapPin },
    { value: 'address', label: 'Address', icon: Hash },
    { value: 'coordinates', label: 'Coordinates', icon: Hash },
    { value: 'area-type', label: 'Area Type', icon: SlidersHorizontal },
  ];

  const availableFilters = ['Residential', 'Commercial', 'Industrial', 'Green Space', 'High AQI', 'Traffic'];

  const toggleFilter = (filter: string) => {
    setFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleSearch = () => {
    console.log('Searching:', { query, mode, filters });
    onSearch(query, mode, filters);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card border border-card-border rounded-lg shadow-lg p-4">
        <div className="flex gap-2 mb-3">
          {modes.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              size="sm"
              variant={mode === value ? 'default' : 'ghost'}
              onClick={() => setMode(value)}
              className="text-xs"
              data-testid={`button-mode-${value}`}
            >
              <Icon className="w-3 h-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={`Search by ${mode.replace('-', ' ')}...`}
              className="pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              data-testid="input-search"
            />
          </div>
          <Button onClick={handleSearch} data-testid="button-search">
            Search
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-sm font-medium mb-2">Filters</div>
            <div className="flex flex-wrap gap-2">
              {availableFilters.map(filter => (
                <Badge
                  key={filter}
                  variant={filters.includes(filter) ? 'default' : 'outline'}
                  className="cursor-pointer hover-elevate"
                  onClick={() => toggleFilter(filter)}
                  data-testid={`filter-${filter.toLowerCase().replace(' ', '-')}`}
                >
                  {filter}
                  {filters.includes(filter) && <X className="w-3 h-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
