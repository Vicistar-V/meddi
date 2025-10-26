import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Pill } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DoseGroup } from '@/lib/medicationHelpers';
import { getRelativeTime } from '@/lib/timeHelpers';
import { formatTimeDisplay } from '@/lib/medicationHelpers';
import { useToast } from '@/hooks/use-toast';

interface CurrentDoseFocusProps {
  nextDose: DoseGroup | null;
  status: 'overdue' | 'current' | 'upcoming' | 'complete';
  currentTime?: Date;
  onMarkTaken?: (dose: DoseGroup) => void;
  onSkip?: (dose: DoseGroup) => void;
}

export const CurrentDoseFocus = ({
  nextDose,
  status,
  currentTime = new Date(),
  onMarkTaken,
  onSkip
}: CurrentDoseFocusProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const { toast } = useToast();

  const handleMarkTaken = async () => {
    if (!nextDose || !onMarkTaken) return;
    setIsMarking(true);
    try {
      await onMarkTaken(nextDose);
    } finally {
      setIsMarking(false);
    }
  };

  const handleSkip = () => {
    if (!nextDose || !onSkip) return;
    onSkip(nextDose);
  };

  // All Complete State
  if (status === 'complete') {
    return (
      <Card className="border-2 bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-950/20 dark:to-emerald-950/20 border-green-500/50">
        <div className="p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
            All doses complete
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            Next dose: Tomorrow at 8:00 AM
          </p>
        </div>
      </Card>
    );
  }

  if (!nextDose) return null;

  const relativeTime = getRelativeTime(nextDose.time, currentTime);
  const pillCount = nextDose.schedules.length;

  // Status styling
  const isOverdue = status === 'overdue';
  const isCurrent = status === 'current';

  return (
    <Card className={cn(
      "border-2 transition-all duration-300",
      isOverdue && "border-orange-500/50 bg-gradient-to-br from-orange-50/70 to-amber-50/70 dark:from-orange-950/20 dark:to-amber-950/20",
      isCurrent && "border-primary bg-gradient-cream ring-2 ring-primary/20 shadow-lg",
      !isOverdue && !isCurrent && "border-border bg-gradient-cream"
    )}>
      <div className="p-5">
        {/* Status Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              isOverdue && "bg-orange-500 text-white",
              isCurrent && "bg-primary text-primary-foreground animate-pulse",
              !isOverdue && !isCurrent && "bg-secondary text-muted-foreground"
            )}>
              {isOverdue ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className={cn(
                "text-xs font-medium uppercase tracking-wide",
                isOverdue && "text-orange-700 dark:text-orange-400",
                isCurrent && "text-primary"
              )}>
                {isOverdue ? 'OVERDUE' : 'NEXT DOSE'}
              </p>
              <p className="text-lg font-semibold">
                {formatTimeDisplay(nextDose.time)}
                <span className={cn(
                  "ml-2 text-sm font-normal",
                  isOverdue ? "text-orange-600" : "text-muted-foreground"
                )}>
                  ({relativeTime})
                </span>
              </p>
            </div>
          </div>

          {/* Expand Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Medication Preview (Collapsed) */}
        {!isExpanded && (
          <div className="mb-4 rounded-lg bg-background/50 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Pill className="h-4 w-4" />
              <span>
                {pillCount} {pillCount === 1 ? 'medication' : 'medications'}
              </span>
            </div>
          </div>
        )}

        {/* Medication List (Expanded) */}
        {isExpanded && (
          <div className="mb-4 space-y-2 rounded-lg bg-background/50 p-3">
            {nextDose.schedules.map((item, index) => (
              <div
                key={`${item.schedule.id}-${index}`}
                className="flex items-start gap-2 text-sm"
              >
                <Pill className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div>
                  <p className="font-medium">{item.medication.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.medication.dosage}
                  </p>
                  {item.medication.instructions && (
                    <p className="text-xs text-muted-foreground italic mt-1">
                      {item.medication.instructions}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {(isCurrent || isOverdue) && (
          <div className="flex gap-2">
            <Button
              onClick={handleMarkTaken}
              disabled={isMarking}
              className="flex-1"
              size="lg"
            >
              {isMarking ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Logging...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {isOverdue ? 'Log Now' : 'Take All'}
                </>
              )}
            </Button>
            {isCurrent && (
              <Button
                onClick={handleSkip}
                variant="outline"
                size="lg"
              >
                Skip
              </Button>
            )}
          </div>
        )}

        {/* Upcoming State */}
        {!isCurrent && !isOverdue && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full"
            >
              View Details
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
