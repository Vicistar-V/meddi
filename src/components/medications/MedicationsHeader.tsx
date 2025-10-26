import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Pill, Calendar, TrendingUp } from 'lucide-react';

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
    <Card className="bg-gradient-cream p-6 shadow-warm border-border/50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Medications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your medication schedule and track adherence
          </p>
        </div>
        <Button onClick={onAddClick} size="lg" className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Medication
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Pill className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{medicationCount}</p>
            <p className="text-xs text-muted-foreground">Medications</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{scheduleCount}</p>
            <p className="text-xs text-muted-foreground">Schedules</p>
          </div>
        </div>

        {adherenceRate > 0 && (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{adherenceRate}%</p>
              <p className="text-xs text-muted-foreground">Adherence</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
