import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

interface MedicationFiltersCardProps {
  statusFilter?: 'all' | 'active';
  onStatusFilterChange?: (filter: 'all' | 'active') => void;
  frequencyFilters?: string[];
  onFrequencyFiltersChange?: (filters: string[]) => void;
  onReset?: () => void;
}

export const MedicationFiltersCard = ({
  statusFilter = 'all',
  onStatusFilterChange,
  frequencyFilters = [],
  onFrequencyFiltersChange,
  onReset,
}: MedicationFiltersCardProps) => {
  const handleFrequencyToggle = (frequency: string) => {
    if (!onFrequencyFiltersChange) return;
    
    const newFilters = frequencyFilters.includes(frequency)
      ? frequencyFilters.filter(f => f !== frequency)
      : [...frequencyFilters, frequency];
    
    onFrequencyFiltersChange(newFilters);
  };

  const frequencyOptions = [
    { value: 'once', label: 'Once Daily' },
    { value: 'twice', label: 'Twice Daily' },
    { value: 'multiple', label: 'Multiple Times' },
    { value: 'as-needed', label: 'As Needed' },
  ];

  return (
    <Card className="bg-gradient-cream p-5 shadow-warm border-border/50 sticky top-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Filters
      </h3>

      {/* Status Filter */}
      {onStatusFilterChange && (
        <div className="space-y-3 mb-6">
          <Label className="text-sm font-medium text-foreground">Status</Label>
          <RadioGroup value={statusFilter} onValueChange={(val) => onStatusFilterChange(val as any)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="filter-all" />
              <Label htmlFor="filter-all" className="text-sm font-normal cursor-pointer">
                All Medications
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="active" id="filter-active" />
              <Label htmlFor="filter-active" className="text-sm font-normal cursor-pointer">
                Active Only
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Frequency Filter */}
      {onFrequencyFiltersChange && (
        <div className="space-y-3 mb-6">
          <Label className="text-sm font-medium text-foreground">Frequency</Label>
          <div className="space-y-2">
            {frequencyOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`freq-${option.value}`}
                  checked={frequencyFilters.includes(option.value)}
                  onCheckedChange={() => handleFrequencyToggle(option.value)}
                />
                <Label
                  htmlFor={`freq-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Button */}
      {onReset && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="w-full"
        >
          Reset Filters
        </Button>
      )}
    </Card>
  );
};
