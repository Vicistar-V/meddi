import { User, Calendar, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
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

        {/* Stats Row */}
        <div className="mt-5 flex flex-wrap items-center gap-6">
          {/* Today's Progress */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <ProgressRing progress={todayProgress} size={48} strokeWidth={4} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold">{todayProgress}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-sm font-semibold">Progress</p>
            </div>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-2 rounded-full bg-background/50 px-3 py-1.5">
            <span className="text-lg">🔥</span>
            <div>
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="text-sm font-semibold">{weekStreak} {weekStreak === 1 ? 'day' : 'days'}</p>
            </div>
          </div>

          {/* Weekly Adherence */}
          <div className="flex items-center gap-2 rounded-full bg-background/50 px-3 py-1.5">
            <TrendingUp className={cn(
              "h-4 w-4",
              weeklyAdherence >= 80 ? "text-green-600" : "text-orange-600"
            )} />
            <div>
              <p className="text-xs text-muted-foreground">This Week</p>
              <p className="text-sm font-semibold">{weeklyAdherence}%</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
