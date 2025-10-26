import { User, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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
    <Card className="border-2 bg-gradient-warm-cream overflow-hidden">
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
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Today's Progress</p>
            <p className="text-xs font-semibold">{todayProgress}%</p>
          </div>
          <Progress value={todayProgress} className="h-2" />
        </div>
      </div>
    </Card>
  );
};
