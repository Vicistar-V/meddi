import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Pill, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { DoseGroup, formatTimeDisplay, DoseStatus } from '@/lib/medicationHelpers';
import { calculateTimeAgo } from '@/lib/timeHelpers';
import { useMedications } from '@/hooks/useMedications';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface NextDoseCardProps {
  nextDose: DoseGroup | null;
  status?: DoseStatus | null;
  onDoseComplete?: () => void;
}

export const NextDoseCard = ({ nextDose, status, onDoseComplete }: NextDoseCardProps) => {
  const { logMedication } = useMedications();
  const { toast } = useToast();
  const [markingScheduleId, setMarkingScheduleId] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    // Reset state when dose changes
    setMarkingScheduleId(null);
    setIsCompleting(false);
    setShowCelebration(false);
  }, [nextDose?.time]);

  if (!nextDose) {
    return (
      <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 animate-scale-in">
            <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="mb-2 text-2xl font-bold text-green-800 dark:text-green-200">
            You're all set for today! 🎉
          </h3>
          <p className="text-muted-foreground">
            Great job staying on track with your medications!
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleMarkSingleTaken = async (scheduleId: string, medicationName: string) => {
    setMarkingScheduleId(scheduleId);
    
    try {
      await logMedication.mutateAsync({
        schedule_id: scheduleId,
        status: 'taken',
      });

      toast({
        title: 'Medication Logged! ✓',
        description: `${medicationName} marked as taken`,
      });

      // Check if this was the last medication in the dose
      if (nextDose && nextDose.schedules.length === 1) {
        setIsCompleting(true);
        setShowCelebration(true);
        setTimeout(() => {
          onDoseComplete?.();
        }, 1500);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log medication',
      });
    } finally {
      setMarkingScheduleId(null);
    }
  };

  const handleMarkAllTaken = async () => {
    if (!nextDose) return;

    try {
      // Mark all medications as taken
      await Promise.all(
        nextDose.schedules.map(item => 
          logMedication.mutateAsync({ 
            schedule_id: item.schedule.id, 
            status: 'taken' 
          })
        )
      );

      // Trigger celebration
      setIsCompleting(true);
      setShowCelebration(true);

      // Show toast with different message for overdue doses
      toast({
        title: status === 'missed' ? 'Dose Logged! 🎯' : 'Dose Complete! 🎉',
        description: status === 'missed'
          ? 'Better late than never! Logged at actual time.'
          : 'Great job staying on track!',
      });

      // Call onComplete callback
      setTimeout(() => {
        onDoseComplete?.();
      }, 1500);

    } catch (error) {
      console.error('Error logging medications:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log medications. Please try again.',
      });
    }
  };


  return (
    <Card className={cn(
      'border-2 transition-all duration-500',
      status === 'missed' && !isCompleting && 'border-red-500 bg-red-50 dark:bg-red-950/20 ring-2 ring-red-500/20',
      isCompleting && 'border-green-500 bg-green-50 dark:bg-green-950/20',
      !isCompleting && status !== 'missed' && 'border-primary/20 hover:border-primary/40'
    )}>
      <CardHeader>
        <CardTitle className={cn(
          'flex items-center gap-2 text-xl transition-colors',
          isCompleting && 'text-green-700 dark:text-green-300',
          status === 'missed' && !isCompleting && 'text-red-700 dark:text-red-300'
        )}>
          {isCompleting ? (
            <>
              <Check className="h-6 w-6 animate-scale-in" />
              {formatTimeDisplay(nextDose.time)} Dose Complete! 🎉
            </>
          ) : status === 'missed' ? (
            <>
              <AlertCircle className="h-6 w-6 text-red-600" />
              {formatTimeDisplay(nextDose.time)} Dose - Overdue
            </>
          ) : (
            <>
              <Pill className="h-6 w-6" />
              {formatTimeDisplay(nextDose.time)} {nextDose.timeOfDay} Dose
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overdue Badge */}
        {status === 'missed' && !isCompleting && (
          <div className="flex items-center gap-2 rounded-lg bg-red-100 dark:bg-red-900/30 px-4 py-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="font-semibold text-red-700 dark:text-red-400">
              OVERDUE - {calculateTimeAgo(nextDose.time)} late
            </span>
          </div>
        )}
        {/* Medications List */}
        <div className="space-y-2">
          {nextDose.schedules.map((item) => {
            const isMarking = markingScheduleId === item.schedule.id;
            
            return (
              <div
                key={item.schedule.id}
                className={cn(
                  "group relative overflow-hidden rounded-lg border bg-card transition-all duration-200",
                  "hover:shadow-md hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-3 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Pill className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight">
                      {item.medication.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.medication.dosage}
                    </p>
                    {item.medication.instructions && (
                      <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1 italic">
                        {item.medication.instructions}
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleMarkSingleTaken(item.schedule.id, item.medication.name)}
                    disabled={isMarking || isCompleting}
                    className="shrink-0"
                  >
                    {isMarking ? (
                      'Logging...'
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Take
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mark All Button with Confirmation */}
        {!isCompleting && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="w-full mt-2"
                size="lg"
              >
                <Check className="mr-2 h-5 w-5" />
                Mark All as Taken
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark All Medications as Taken?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will log all {nextDose.schedules.length} medication{nextDose.schedules.length > 1 ? 's' : ''} from this dose as taken at the current time.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleMarkAllTaken}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {showCelebration && isCompleting && (
          <div className="text-center animate-fade-in">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              Keep up the great work! 💪
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
