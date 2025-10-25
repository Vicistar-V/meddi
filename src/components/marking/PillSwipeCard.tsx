import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Pill, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  instructions?: string;
}

interface Schedule {
  id: string;
}

interface PillSwipeCardProps {
  medication: Medication;
  schedule: Schedule;
  pillIndex: number;
  totalPills: number;
  onTaken: () => void;
}

export const PillSwipeCard = ({
  medication,
  schedule,
  pillIndex,
  totalPills,
  onTaken,
}: PillSwipeCardProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const haptic = useHapticFeedback();

  const handleSwipeComplete = () => {
    haptic.success();
    setIsExiting(true);
    setTimeout(() => {
      onTaken();
    }, 600);
  };

  const { handlers, swipeProgress } = useSwipeGesture({
    onSwipeRight: handleSwipeComplete,
    threshold: 150,
  });

  const handleButtonClick = () => {
    handleSwipeComplete();
  };

  const pillColors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500',
  ];

  const colorClass = pillColors[pillIndex % pillColors.length];

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress Indicator */}
      <div className="mb-4 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {pillIndex + 1} of {totalPills} pills
        </p>
        <div className="mt-2 w-full h-1.5 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((pillIndex + 1) / totalPills) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Card */}
      <Card
        className={cn(
          "relative overflow-hidden border-2 transition-all duration-600",
          isExiting && "animate-card-exit",
          swipeProgress > 0 && "border-green-500"
        )}
        style={{
          transform: isExiting 
            ? 'scale(0.8) rotate(-10deg) translateX(120%)' 
            : `translateX(${swipeProgress * 100}px) rotate(${swipeProgress * -5}deg)`,
          opacity: isExiting ? 0 : 1,
        }}
        {...handlers}
      >
        <CardContent className="p-8 space-y-6">
          {/* Pill Visual */}
          <div className="flex justify-center">
            <div
              className={cn(
                "flex h-24 w-24 items-center justify-center rounded-full shadow-lg",
                colorClass,
                "animate-scale-in"
              )}
            >
              <Pill className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Medication Info */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold">{medication.name}</h3>
            <p className="text-lg text-muted-foreground">{medication.dosage}</p>
            {medication.instructions && (
              <p className="text-sm text-muted-foreground italic px-4">
                {medication.instructions}
              </p>
            )}
          </div>

          {/* Swipe Instruction */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <span className="text-sm">Swipe to mark taken</span>
            <ArrowRight className="h-4 w-4 animate-pulse" />
          </div>

          {/* Swipe Progress Bar */}
          {swipeProgress > 0 && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500/20">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${swipeProgress * 100}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Or Tap Button */}
      <div className="mt-4 text-center space-y-2">
        <p className="text-xs text-muted-foreground">Or tap here</p>
        <Button
          onClick={handleButtonClick}
          size="lg"
          className="w-full"
          disabled={isExiting}
        >
          <Check className="mr-2 h-5 w-5" />
          Mark as Taken
        </Button>
      </div>
    </div>
  );
};
