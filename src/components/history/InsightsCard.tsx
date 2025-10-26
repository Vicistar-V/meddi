import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Sun, Moon, Sunrise, Sunset, Calendar } from 'lucide-react';

interface InsightsCardProps {
  patterns: {
    bestTime: string;
    bestDay: string;
    totalDosesTaken: number;
  } | null;
}

export const InsightsCard = ({ patterns }: InsightsCardProps) => {
  if (!patterns) {
    return (
      <Card className="bg-gradient-warm-cream shadow-cream">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Sparkles className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Track medications for a week to see your patterns
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTimeIcon = (time: string) => {
    switch (time) {
      case 'morning': return <Sunrise className="h-5 w-5 text-amber-500" />;
      case 'afternoon': return <Sun className="h-5 w-5 text-orange-500" />;
      case 'evening': return <Sunset className="h-5 w-5 text-rose-500" />;
      case 'night': return <Moon className="h-5 w-5 text-indigo-500" />;
      default: return <Sun className="h-5 w-5" />;
    }
  };

  const formatDay = (day: string) => {
    const days: Record<string, string> = {
      sun: 'Sunday',
      mon: 'Monday',
      tue: 'Tuesday',
      wed: 'Wednesday',
      thu: 'Thursday',
      fri: 'Friday',
      sat: 'Saturday'
    };
    return days[day] || day;
  };

  return (
    <Card className="bg-gradient-latte shadow-warm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Your Patterns & Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4 rounded-lg border bg-background/50 p-4">
          {getTimeIcon(patterns.bestTime)}
          <div>
            <p className="font-semibold">Best Time of Day</p>
            <p className="text-sm text-muted-foreground">
              You're most consistent during the <span className="font-medium text-foreground">{patterns.bestTime}</span>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-lg border bg-background/50 p-4">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <p className="font-semibold">Best Day of Week</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{formatDay(patterns.bestDay)}</span> is your most reliable day
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-success-light/30 p-4 text-center">
          <p className="text-2xl font-bold text-success-dark">{patterns.totalDosesTaken}</p>
          <p className="text-sm text-muted-foreground">Total doses taken successfully</p>
        </div>
      </CardContent>
    </Card>
  );
};
