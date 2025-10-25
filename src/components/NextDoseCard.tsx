import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, Pill, AlertCircle } from 'lucide-react';
import { DoseGroup, formatTimeDisplay, DoseStatus } from '@/lib/medicationHelpers';
import { calculateTimeAgo } from '@/lib/timeHelpers';
import { useMedications } from '@/hooks/useMedications';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NextDoseCardProps {
  nextDose: DoseGroup | null;
  status?: DoseStatus | null;
  onDoseComplete?: () => void;
}

export const NextDoseCard = ({ nextDose, status, onDoseComplete }: NextDoseCardProps) => {
  const { logMedication } = useMedications();
  const { toast } = useToast();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isMarking, setIsMarking] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    // Reset state when dose changes
    setCheckedItems(new Set());
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

  const allChecked = nextDose.schedules.every(item => 
    checkedItems.has(item.schedule.id)
  );

  const handleCheckItem = (scheduleId: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scheduleId)) {
        newSet.delete(scheduleId);
      } else {
        newSet.add(scheduleId);
      }
      return newSet;
    });
  };

  const handleMarkAllTaken = async () => {
    setIsMarking(true);

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

      // Trigger celebration sequence
      setShowCelebration(true);

      // Stagger checkmark animations
      nextDose.schedules.forEach((item, index) => {
        setTimeout(() => {
          setCheckedItems(prev => new Set(prev).add(item.schedule.id));
        }, index * 150);
      });

      // After all checkmarks appear
      setTimeout(() => {
        setIsCompleting(true);
      }, nextDose.schedules.length * 150 + 300);

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
      }, 2000);

    } catch (error) {
      console.error('Error logging medications:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log medications. Please try again.',
      });
      setCheckedItems(new Set());
    } finally {
      setIsMarking(false);
    }
  };

  const pillColors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500',
  ];

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
        {/* Pill List */}
        <div className="space-y-3">
          {nextDose.schedules.map((item, index) => {
            const isChecked = checkedItems.has(item.schedule.id);
            const colorClass = pillColors[index % pillColors.length];

            return (
              <div
                key={item.schedule.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-all',
                  isChecked && 'border-green-500 bg-green-50 dark:bg-green-950/20'
                )}
              >
                <Checkbox
                  id={item.schedule.id}
                  checked={isChecked}
                  onCheckedChange={() => handleCheckItem(item.schedule.id)}
                  disabled={isMarking || isCompleting}
                  className={cn(isChecked && 'animate-scale-in')}
                />
                
                {/* Pill Icon */}
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  colorClass,
                  'text-white'
                )}>
                  <Pill className="h-5 w-5" />
                </div>

                {/* Medication Info */}
                <div className="flex-1">
                  <h4 className="font-semibold">{item.medication.name}</h4>
                  <p className="text-sm text-muted-foreground">{item.medication.dosage}</p>
                  {item.medication.instructions && (
                    <p className="text-xs text-muted-foreground italic">
                      {item.medication.instructions}
                    </p>
                  )}
                </div>

                {isChecked && (
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 animate-scale-in" />
                )}
              </div>
            );
          })}
        </div>

        {/* Mark All Button */}
        {!isCompleting && (
          <Button
            className="w-full"
            size="lg"
            onClick={handleMarkAllTaken}
            disabled={isMarking}
          >
            {isMarking ? (
              'Logging...'
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                Mark All as Taken
              </>
            )}
          </Button>
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
