import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DOSAGE_UNITS = ['mg', 'ml', 'mcg', 'g', 'IU', '%', 'drops', 'puffs', 'units'];

interface DosageInputProps {
  dosage: string;
  dosageUnit: string;
  onDosageChange: (value: string) => void;
  onUnitChange: (value: string) => void;
}

export const DosageInput = ({ dosage, dosageUnit, onDosageChange, onUnitChange }: DosageInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="dosage" className="text-sm font-medium">
        Dosage / Strength <span className="text-destructive">*</span>
      </Label>
      <div className="flex gap-2">
        <Input
          id="dosage"
          type="text"
          value={dosage}
          onChange={(e) => onDosageChange(e.target.value)}
          placeholder="e.g., 20"
          className="flex-1 bg-background"
        />
        <Select value={dosageUnit} onValueChange={onUnitChange}>
          <SelectTrigger className="w-24 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOSAGE_UNITS.map((unit) => (
              <SelectItem key={unit} value={unit}>
                {unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
