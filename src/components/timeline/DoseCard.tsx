import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DoseGroup } from '@/lib/medicationHelpers';
import { getRelativeTime } from '@/lib/timeHelpers';
import { formatTimeDisplay } from '@/lib/medicationHelpers';

interface DoseCardProps {
  dose: DoseGroup;
  status: 'completed' | 'current' | 'upcoming' | 'missed';
  currentTime?: Date;
  onMarkTaken?: (dose: DoseGroup) => void;
}

export const DoseCard = ({ 
  dose, 
  status, 
  currentTime = new Date(),
  onMarkTaken 
}: DoseCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  const relativeTime = getRelativeTime(dose.time, currentTime);
  const pillCount = dose.schedules.length;

  const handleMarkTaken = async () => {
    if (!onMarkTaken) return;
    setIsMarking(true);
    await onMarkTaken(dose);
    setIsMarking(false);
  };

  // Status-based styling
  const cardStyles = {
    completed: "border-green-500/50 bg-green-50/50 dark:bg-green-950/20 hover:border-green-500/70",
    current: "border-primary bg-primary/5 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 ring-2 ring-primary/20",
    upcoming: "border-border bg-card hover:border-primary/30 hover:shadow-md",
    missed: "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/20 hover:border-orange-500/70"
  };

  const iconStyles = {
    completed: "bg-green-500 text-white",
    current: "bg-primary text-primary-foreground animate-pulse",
    upcoming: "bg-secondary text-muted-foreground",
    missed: "bg-orange-500 text-white"
  };

  const Icon = {
    completed: Check,
    current: Clock,
    upcoming: Clock,
    missed: AlertCircle
  }[status];

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 cursor-pointer",
        cardStyles[status],
        isExpanded && "ring-2 ring-primary/40"
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-4">
        {/* Main Content */}
        <div className="flex items-start justify-between gap-4">
          {/* Left: Icon + Time Info */}
          <div className="flex items-start gap-3">
            {/* Status Icon */}
            <div className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all",
              iconStyles[status]
            )}>
              <Icon className="h-5 w-5" />
            </div>

            {/* Time & Pills Info */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <p className={cn(
                  "text-lg font-semibold",
                  status === 'completed' && "text-green-700 dark:text-green-400",
                  status === 'current' && "text-primary",
                  status === 'upcoming' && "text-foreground",
                  status === 'missed' && "text-orange-700 dark:text-orange-400"
                )}>
                  {formatTimeDisplay(dose.time)}
                </p>
                <span className={cn(
                  "text-xs font-medium",
                  status === 'current' && "text-primary",
                  status === 'missed' && "text-orange-600 dark:text-orange-400",
                  (status === 'completed' || status === 'upcoming') && "text-muted-foreground"
                )}>
                  {relativeTime}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {pillCount} {pillCount === 1 ? 'pill' : 'pills'}
              </p>

              {/* Medication Preview */}
              {!isExpanded && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {dose.schedules.slice(0, 2).map(item => item.medication.name).join(', ')}
                  {dose.schedules.length > 2 && ` +${dose.schedules.length - 2}`}
                </p>
              )}
            </div>
          </div>

          {/* Right: Status Badge & Expand Icon */}
          <div className="flex flex-col items-end gap-2">
            {status === 'completed' && (
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                Completed
              </span>
            )}
            {status === 'missed' && (
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                Missed
              </span>
            )}
            <div className="text-muted-foreground">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div 
            className="mt-4 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Medication List */}
            <div className="space-y-2 rounded-lg bg-background/50 p-3">
              {dose.schedules.map((item, index) => (
                <div 
                  key={`${item.schedule.id}-${index}`}
                  className="flex items-start gap-2 text-sm"
                >
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                  <div>
                    <p className="font-medium">{item.medication.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.medication.dosage}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reassuring message for overdue doses */}
            {status === 'missed' && (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground italic">
                💡 Don't worry - we'll log this at the time you actually took it
              </div>
            )}

            {/* Action Buttons */}
            {(status === 'current' || status === 'missed') && onMarkTaken && (
              <Button 
                onClick={handleMarkTaken}
                disabled={isMarking}
                className="w-full"
                size="sm"
              >
                {isMarking ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Logging...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Mark All as Taken
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
