import { Card } from '@/components/ui/card';
import { CheckCircle, Clock, Target, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyStatsCardProps {
  adherence: number;
  completedCount: number;
  totalCount: number;
  onTimePercentage: number;
  streak: number;
}

export const DailyStatsCard = ({
  adherence,
  completedCount,
  totalCount,
  onTimePercentage,
  streak
}: DailyStatsCardProps) => {
  return (
    <Card className="border-2 bg-gradient-warm-cream">
      <div className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Today's Stats
        </h3>
        
        <div className="space-y-4">
          {/* Adherence */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium">Adherence</span>
            </div>
            <span className={cn(
              "text-lg font-bold",
              adherence >= 80 ? "text-success" : "text-orange-600"
            )}>
              {adherence}%
            </span>
          </div>

          {/* Completed */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <span className="text-sm font-medium">Completed</span>
            </div>
            <span className="text-lg font-bold">
              {completedCount}/{totalCount} doses
            </span>
          </div>

          {/* On Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-medium">On Time</span>
            </div>
            <span className="text-lg font-bold">
              {onTimePercentage}%
            </span>
          </div>

          {/* Streak */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10">
                <Flame className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-sm font-medium">Streak</span>
            </div>
            <span className="text-lg font-bold">
              {streak} {streak === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
