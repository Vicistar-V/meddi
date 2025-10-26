import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Pill, Calendar } from 'lucide-react';

interface MedicationsHeaderProps {
  medicationCount: number;
  scheduleCount: number;
  adherenceRate?: number;
  onAddClick: () => void;
}

export const MedicationsHeader = ({
  medicationCount,
  scheduleCount,
  adherenceRate = 0,
  onAddClick,
}: MedicationsHeaderProps) => {
  return (
    <Card className="bg-gradient-cream p-4 border-border/50 rounded-lg border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Title + Minimal Stats */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground mb-2">My Medications</h1>
          
          {/* Inline minimal stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Pill className="h-4 w-4 text-primary/60" />
              <span className="font-semibold text-foreground">{medicationCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary/60" />
              <span className="font-semibold text-foreground">{scheduleCount}</span>
            </div>
          </div>
        </div>

        {/* Right: Add Button */}
        <Button onClick={onAddClick} size="default" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Medication
        </Button>
      </div>
    </Card>
  );
};
