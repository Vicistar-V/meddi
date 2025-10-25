import { Card } from '@/components/ui/card';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyProgressProps {
  totalDoses: number;
  completedDoses: number;
  missedDoses: number;
  upcomingDoses: number;
}

export const DailyProgress = ({ 
  totalDoses, 
  completedDoses, 
  missedDoses, 
  upcomingDoses 
}: DailyProgressProps) => {
  const percentage = totalDoses > 0 ? Math.round((completedDoses / totalDoses) * 100) : 0;

  return (
    <Card className="overflow-hidden border-2">
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Today's Progress</h3>
            <p className="text-sm text-muted-foreground">
              {completedDoses} of {totalDoses} doses taken
            </p>
          </div>
          <div className="text-3xl font-bold text-primary">
            {percentage}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative mb-4 h-3 overflow-hidden rounded-full bg-secondary">
          {/* Completed segment */}
          {completedDoses > 0 && (
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-700 ease-out"
              style={{ width: `${(completedDoses / totalDoses) * 100}%` }}
            />
          )}
          
          {/* Missed segment */}
          {missedDoses > 0 && (
            <div
              className="absolute top-0 h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-700 ease-out"
              style={{ 
                left: `${(completedDoses / totalDoses) * 100}%`,
                width: `${(missedDoses / totalDoses) * 100}%` 
              }}
            />
          )}

          {/* Animated shimmer effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{
              animation: 'shimmer 2s infinite',
              animationDelay: '0.5s'
            }}
          />
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap gap-2">
          {/* Completed Badge */}
          <div className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
            completedDoses > 0 
              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" 
              : "bg-secondary text-muted-foreground"
          )}>
            <Check className="h-3.5 w-3.5" />
            <span>{completedDoses} Taken</span>
          </div>

          {/* Missed Badge */}
          {missedDoses > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-400 transition-all animate-in fade-in slide-in-from-bottom-2">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{missedDoses} Missed</span>
            </div>
          )}

          {/* Upcoming Badge */}
          {upcomingDoses > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all">
              <Clock className="h-3.5 w-3.5" />
              <span>{upcomingDoses} Upcoming</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
