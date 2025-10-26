import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { InteractionScanButton } from './InteractionScanButton';
import { Medication } from '@/hooks/useMedications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MedicationSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  activeFilter?: 'all' | 'active';
  onFilterChange?: (filter: 'all' | 'active') => void;
  sortBy?: 'name' | 'recent' | 'frequency';
  onSortChange?: (sort: 'name' | 'recent' | 'frequency') => void;
  medications?: Medication[];
}

export const MedicationSearchBar = ({
  searchTerm,
  onSearchChange,
  activeFilter = 'all',
  onFilterChange,
  sortBy = 'name',
  onSortChange,
  medications = [],
}: MedicationSearchBarProps) => {
  const [localSearch, setLocalSearch] = useState(searchTerm);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    // Debounce the actual search
    const timer = setTimeout(() => {
      onSearchChange(value);
    }, 300);
    return () => clearTimeout(timer);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search medications..."
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-9 bg-card"
        />
        {localSearch && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex gap-2">
        {/* Filter Toggle */}
        {onFilterChange && (
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={activeFilter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onFilterChange('all')}
              className="px-3"
            >
              All
            </Button>
            <Button
              variant={activeFilter === 'active' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onFilterChange('active')}
              className="px-3"
            >
              Active
            </Button>
          </div>
        )}

        {/* Sort Dropdown */}
        {onSortChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="px-3">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortBy} onValueChange={(val) => onSortChange(val as any)}>
                <DropdownMenuRadioItem value="name">Name (A-Z)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="recent">Recently Added</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="frequency">Frequency</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Drug Safety Check Button */}
        {medications.length > 0 && (
          <div className="lg:hidden">
            <InteractionScanButton medications={medications} />
          </div>
        )}
      </div>
    </div>
  );
};
