import { Card, CardContent } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Flame, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryHeroStatsProps {
  adherence: number;
  streak: number;
  weeklyData: {
    label: string;
    adherence: number;
  }[];
}

export const HistoryHeroStats = ({ adherence, streak, weeklyData }: HistoryHeroStatsProps) => {
  const thisWeek = weeklyData[0]?.adherence || 0;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 animate-fade-in">
        <h1 className="mb-2 text-3xl font-bold">Your Progress</h1>
        <p className="text-muted-foreground">Track your medication journey</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Monthly Adherence */}
        <Card className="bg-gradient-warm-cream animate-scale-in shadow-cream">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <ProgressRing progress={adherence} size={140} strokeWidth={10} />
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">Monthly Adherence</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {adherence >= 80 ? 'Excellent!' : adherence >= 60 ? 'Good progress' : 'Keep going!'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card className="bg-gradient-latte animate-scale-in shadow-warm" style={{ animationDelay: '100ms' }}>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="relative">
              <div className="flex h-[140px] w-[140px] flex-col items-center justify-center rounded-full bg-background/50">
                <Flame className={cn(
                  "h-16 w-16 mb-2",
                  streak >= 7 ? "text-orange-500" : streak >= 3 ? "text-amber-500" : "text-muted-foreground"
                )} />
                <span className="text-4xl font-bold">{streak}</span>
                <span className="text-sm text-muted-foreground">days</span>
              </div>
              {streak >= 7 && (
                <div className="absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg">
                  🔥
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {streak >= 7 ? 'Amazing streak!' : streak >= 3 ? 'Keep it up!' : 'Start your streak!'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* This Week's Performance */}
        <Card className="bg-gradient-warm-cream animate-scale-in shadow-cream" style={{ animationDelay: '200ms' }}>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="flex h-[140px] w-[140px] flex-col items-center justify-center rounded-full bg-background/50">
              <Calendar className="h-8 w-8 mb-2 text-primary" />
              <span className="text-4xl font-bold">{thisWeek}%</span>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-muted-foreground">This Week</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {thisWeek >= 80 ? 'Great week!' : thisWeek >= 60 ? 'Good effort' : 'You can do it!'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
