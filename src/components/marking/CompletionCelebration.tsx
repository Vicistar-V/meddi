import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTimeDisplay } from '@/lib/medicationHelpers';

interface CompletionCelebrationProps {
  time: string;
  pillCount: number;
  onContinue: () => void;
}

export const CompletionCelebration = ({
  time,
  pillCount,
  onContinue,
}: CompletionCelebrationProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    setTimeout(() => setShowCheckmark(true), 200);
  }, []);

  const confettiColors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-red-500',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      {/* Confetti particles */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-3 h-3 rounded-full animate-confetti-burst",
                confettiColors[i % confettiColors.length]
              )}
              style={{
                left: `${Math.random() * 100}%`,
                top: '50%',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main celebration card */}
      <Card className="w-full max-w-md mx-4 border-2 border-primary shadow-2xl">
        <CardContent className="p-8 text-center space-y-6">
          {/* Sparkles icon */}
          <div className="flex justify-center gap-4">
            <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
            <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
            <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>

          {/* Success checkmark */}
          <div className="flex justify-center">
            <div
              className={cn(
                "flex h-24 w-24 items-center justify-center rounded-full bg-green-500 shadow-lg transition-all duration-500",
                showCheckmark ? "scale-100 opacity-100" : "scale-0 opacity-0"
              )}
            >
              <Check className="h-12 w-12 text-white animate-checkmark-draw" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Dose Complete!</h2>
            <p className="text-lg text-muted-foreground">
              {formatTimeDisplay(time)} - {pillCount} {pillCount === 1 ? 'pill' : 'pills'} taken
            </p>
          </div>

          {/* Encouraging message */}
          <p className="text-sm text-muted-foreground">
            Great job! You're on track with your medications! 💪
          </p>

          {/* Continue button */}
          <Button
            onClick={onContinue}
            size="lg"
            className="w-full"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
