import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Pill } from 'lucide-react';
import { DoseGroup, formatTimeDisplay } from '@/lib/medicationHelpers';
import { useMedications } from '@/hooks/useMedications';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PillSwipeCard } from '@/components/marking/PillSwipeCard';
import { CompletionCelebration } from '@/components/marking/CompletionCelebration';
import { QuickMarkList } from '@/components/marking/QuickMarkList';
import { MarkingModeToggle } from '@/components/marking/MarkingModeToggle';

interface NextDoseCardProps {
  nextDose: DoseGroup | null;
  onDoseComplete?: () => void;
}

type MarkingMode = 'card' | 'list';

export const NextDoseCard = ({ nextDose, onDoseComplete }: NextDoseCardProps) => {
  const { logMedication } = useMedications();
  const { toast } = useToast();
  const [mode, setMode] = useState<MarkingMode>(() => {
    const saved = localStorage.getItem('marking-mode');
    return (saved as MarkingMode) || 'card';
  });
  const [currentPillIndex, setCurrentPillIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [markedSchedules, setMarkedSchedules] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Reset state when dose changes
    setCurrentPillIndex(0);
    setShowCelebration(false);
    setMarkedSchedules(new Set());
  }, [nextDose?.time]);

  useEffect(() => {
    localStorage.setItem('marking-mode', mode);
  }, [mode]);

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

  const handlePillTaken = async () => {
    const currentItem = nextDose.schedules[currentPillIndex];
    
    try {
      await logMedication.mutateAsync({
        schedule_id: currentItem.schedule.id,
        status: 'taken',
      });

      setMarkedSchedules(prev => new Set(prev).add(currentItem.schedule.id));

      // Move to next pill or show celebration
      if (currentPillIndex < nextDose.schedules.length - 1) {
        setTimeout(() => {
          setCurrentPillIndex(prev => prev + 1);
        }, 300);
      } else {
        // All pills taken
        setTimeout(() => {
          setShowCelebration(true);
        }, 600);

        toast({
          title: 'Dose Complete! 🎉',
          description: 'Great job staying on track!',
        });
      }
    } catch (error) {
      console.error('Error logging medication:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log medication. Please try again.',
      });
    }
  };

  const handleMarkSingle = async (scheduleId: string) => {
    try {
      await logMedication.mutateAsync({
        schedule_id: scheduleId,
        status: 'taken',
      });
    } catch (error) {
      console.error('Error logging medication:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log medication. Please try again.',
      });
    }
  };

  const handleMarkAll = async () => {
    setIsMarking(true);

    try {
      await Promise.all(
        nextDose.schedules.map(item =>
          logMedication.mutateAsync({
            schedule_id: item.schedule.id,
            status: 'taken',
          })
        )
      );

      setShowCelebration(true);

      toast({
        title: 'Dose Complete! 🎉',
        description: 'Great job staying on track!',
      });
    } catch (error) {
      console.error('Error logging medications:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log medications. Please try again.',
      });
    } finally {
      setIsMarking(false);
    }
  };

  const handleCelebrationContinue = () => {
    setShowCelebration(false);
    onDoseComplete?.();
  };

  if (showCelebration) {
    return (
      <CompletionCelebration
        time={nextDose.time}
        pillCount={nextDose.schedules.length}
        onContinue={handleCelebrationContinue}
      />
    );
  }

  return (
    <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all">
      <CardHeader>
        <div className="space-y-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Pill className="h-6 w-6" />
            {formatTimeDisplay(nextDose.time)} {nextDose.timeOfDay} Dose
          </CardTitle>

          {/* Mode toggle */}
          <MarkingModeToggle mode={mode} onModeChange={setMode} />
        </div>
      </CardHeader>

      <CardContent>
        {mode === 'card' ? (
          <PillSwipeCard
            medication={nextDose.schedules[currentPillIndex].medication}
            schedule={nextDose.schedules[currentPillIndex].schedule}
            pillIndex={currentPillIndex}
            totalPills={nextDose.schedules.length}
            onTaken={handlePillTaken}
          />
        ) : (
          <QuickMarkList
            items={nextDose.schedules}
            onMarkAll={handleMarkAll}
            onMarkSingle={handleMarkSingle}
            isMarking={isMarking}
          />
        )}
      </CardContent>
    </Card>
  );
};
