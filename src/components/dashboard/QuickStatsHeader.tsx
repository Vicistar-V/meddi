import { User, Calendar, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface QuickStatsHeaderProps {
  userName: string;
  todayProgress: number;
  weekStreak: number;
  weeklyAdherence: number;
}

export const QuickStatsHeader = ({
  userName,
  todayProgress,
  weekStreak,
  weeklyAdherence
}: QuickStatsHeaderProps) => {
  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const hour = currentDate.getHours();
  let greeting = 'Good evening';
  if (hour >= 5 && hour < 12) greeting = 'Good morning';
  else if (hour >= 12 && hour < 17) greeting = 'Good afternoon';

  return (
    <Card className="border-2 bg-gradient-warm-cream backdrop-blur-sm overflow-hidden">
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left: Greeting */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{greeting}</p>
              <h2 className="text-lg font-semibold">{userName}</h2>
            </div>
          </div>

          {/* Right: Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{dateString}</span>
          </div>
        </div>

        {/* Today's Progress Bar */}
        <div className={cn(
          "mt-5 space-y-2 transition-all duration-500",
          todayProgress === 100 && "animate-fade-in"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Today's Progress</p>
              {todayProgress === 100 && (
                <Sparkles className="h-3.5 w-3.5 text-success animate-pulse" />
              )}
            </div>
            <p className={cn(
              "text-xs font-semibold transition-colors duration-300",
              todayProgress === 100 && "text-success"
            )}>
              {todayProgress}%
            </p>
          </div>
          <div className={cn(
            "relative overflow-hidden rounded-full transition-all duration-300",
            todayProgress === 100 && "shadow-[0_0_20px_rgba(139,195,145,0.4)]"
          )}>
            <Progress 
              value={todayProgress} 
              className={cn(
                "h-2 transition-all duration-500",
                todayProgress === 100 && "bg-success/20"
              )}
            />
          </div>
          {todayProgress === 100 && (
            <p className="text-xs text-success font-medium animate-fade-in text-center">
              🎉 Perfect day! All doses completed!
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
