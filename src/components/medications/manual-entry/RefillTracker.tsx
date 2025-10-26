import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, AlertTriangle } from 'lucide-react';

interface Schedule {
  id: string;
  label: string;
  time: string;
  days: string[];
}

interface RefillTrackerProps {
  currentQuantity: number;
  schedules: Schedule[];
}

export const RefillTracker = ({ currentQuantity, schedules }: RefillTrackerProps) => {
  // Calculate doses per day
  const dosesPerDay = schedules.reduce((sum, schedule) => {
    // Assuming each schedule means 1 dose per occurrence
    return sum + schedule.days.length;
  }, 0) / 7; // Average per day

  const daysRemaining = Math.floor(currentQuantity / dosesPerDay);
  const isLowSupply = daysRemaining < 7;

  return (
    <Card className="p-6 bg-gradient-mocha shadow-warm border-border/50">
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Refill Status</h3>
            <p className="text-xs text-muted-foreground">Based on your current quantity and schedule</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Supply</span>
            <span className="font-semibold text-foreground">{currentQuantity} pills</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Days Remaining</span>
            <span className={`font-semibold ${isLowSupply ? 'text-destructive' : 'text-foreground'}`}>
              ~{daysRemaining} days
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Average Daily Use</span>
            <span className="font-semibold text-foreground">{dosesPerDay.toFixed(1)} pills/day</span>
          </div>
        </div>

        {isLowSupply && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Low supply! You should refill soon (less than 7 days remaining).
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
};
