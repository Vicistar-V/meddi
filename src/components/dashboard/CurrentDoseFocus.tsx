import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Clock, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Pill, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DoseGroup } from '@/lib/medicationHelpers';
import { getRelativeTime } from '@/lib/timeHelpers';
import { formatTimeDisplay } from '@/lib/medicationHelpers';
import { useToast } from '@/hooks/use-toast';
import { MedicationLog } from '@/hooks/useMedications';

interface CurrentDoseFocusProps {
  nextDose: DoseGroup | null;
  status: 'overdue' | 'current' | 'upcoming' | 'complete';
  currentTime?: Date;
  onMarkTaken?: (dose: DoseGroup) => void;
  onMarkIndividual?: (scheduleId: string, medicationName: string) => void;
  onSkip?: (dose: DoseGroup) => void;
  todayLogs?: MedicationLog[];
}

export const CurrentDoseFocus = ({
  nextDose,
  status,
  currentTime = new Date(),
  onMarkTaken,
  onMarkIndividual,
  onSkip,
  todayLogs = []
}: CurrentDoseFocusProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [markingIndividual, setMarkingIndividual] = useState<string | null>(null);
  const [confirmEarly, setConfirmEarly] = useState<{ scheduleId: string; medName: string } | null>(null);
  const [confirmEarlyAll, setConfirmEarlyAll] = useState(false);
  const { toast } = useToast();

  // Check if a schedule is already logged
  const isScheduleLogged = (scheduleId: string) => {
    return todayLogs.some(log => log.schedule_id === scheduleId && log.status === 'taken');
  };

  const handleMarkTaken = async () => {
    if (!nextDose || !onMarkTaken) return;
    
    // If upcoming, show confirmation
    if (!isCurrent && !isOverdue) {
      setConfirmEarlyAll(true);
      return;
    }
    
    setIsMarking(true);
    try {
      await onMarkTaken(nextDose);
    } finally {
      setIsMarking(false);
    }
  };

  const handleConfirmEarlyAll = async () => {
    if (!nextDose || !onMarkTaken) return;
    setConfirmEarlyAll(false);
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

  const handleMarkIndividualMed = async (scheduleId: string, medicationName: string) => {
    if (!onMarkIndividual) return;
    
    // If upcoming, show confirmation
    if (!isCurrent && !isOverdue) {
      setConfirmEarly({ scheduleId, medName: medicationName });
      return;
    }
    
    setMarkingIndividual(scheduleId);
    try {
      await onMarkIndividual(scheduleId, medicationName);
    } finally {
      setMarkingIndividual(null);
    }
  };

  const handleConfirmEarlyIndividual = async () => {
    if (!confirmEarly || !onMarkIndividual) return;
    const { scheduleId, medName } = confirmEarly;
    setConfirmEarly(null);
    setMarkingIndividual(scheduleId);
    try {
      await onMarkIndividual(scheduleId, medName);
    } finally {
      setMarkingIndividual(null);
    }
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
            {nextDose.schedules.map((item, index) => {
              const isLogged = isScheduleLogged(item.schedule.id);
              const isMarkingThis = markingIndividual === item.schedule.id;
              
              return (
                <div
                  key={`${item.schedule.id}-${index}`}
                  className="flex items-start gap-2 text-sm"
                >
                  <Pill className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium", isLogged && "text-muted-foreground line-through")}>
                      {item.medication.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.medication.dosage}
                    </p>
                    {item.medication.instructions && (
                      <p className="text-xs text-muted-foreground italic mt-1">
                        {item.medication.instructions}
                      </p>
                    )}
                  </div>
                  {onMarkIndividual && (
                    <Button
                      size="sm"
                      variant={isLogged ? "ghost" : (!isCurrent && !isOverdue) ? "outline" : "default"}
                      className="h-7 px-2"
                      onClick={() => handleMarkIndividualMed(item.schedule.id, item.medication.name)}
                      disabled={isLogged || isMarkingThis}
                    >
                      {isLogged ? (
                        <Check className="h-3 w-3" />
                      ) : isMarkingThis ? (
                        <Clock className="h-3 w-3 animate-spin" />
                      ) : (
                        'Take'
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleMarkTaken}
            disabled={isMarking}
            className="flex-1"
            size="lg"
            variant={!isCurrent && !isOverdue ? "outline" : "default"}
          >
            {isMarking ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Logging...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isOverdue ? 'Log Now' : isCurrent ? 'Take All' : 'Take Early'}
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
      </div>

      {/* Early Confirmation Dialog - All */}
      <AlertDialog open={confirmEarlyAll} onOpenChange={setConfirmEarlyAll}>
        <AlertDialogContent className="border-2 border-border bg-gradient-cream">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Take medication early?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This dose is scheduled for <span className="font-semibold text-foreground">{formatTimeDisplay(nextDose?.time || '')}</span> ({relativeTime}). 
              Are you sure you want to take it now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEarlyAll}>
              Yes, Take Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Early Confirmation Dialog - Individual */}
      <AlertDialog open={!!confirmEarly} onOpenChange={(open) => !open && setConfirmEarly(null)}>
        <AlertDialogContent className="border-2 border-border bg-gradient-cream">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Take medication early?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              <span className="font-semibold text-foreground">{confirmEarly?.medName}</span> is scheduled for <span className="font-semibold text-foreground">{formatTimeDisplay(nextDose?.time || '')}</span> ({relativeTime}). 
              Are you sure you want to take it now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEarlyIndividual}>
              Yes, Take Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
