import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

interface DayData {
  date: Date;
  dayName: string;
  totalDoses: number;
  takenDoses: number;
  percentage: number;
}

interface WeeklyScheduleOverviewProps {
  weeklyData: DayData[];
  overallAdherence: number;
}

export const WeeklyScheduleOverview = ({
  weeklyData,
  overallAdherence,
}: WeeklyScheduleOverviewProps) => {
  const getAdherenceColor = (percentage: number) => {
    if (percentage === 100) return 'text-success';
    if (percentage >= 80) return 'text-success/80';
    if (percentage >= 50) return 'text-orange-500';
    if (percentage > 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getAdherenceBg = (percentage: number) => {
    if (percentage === 100) return 'bg-success';
    if (percentage >= 80) return 'bg-success/80';
    if (percentage >= 50) return 'bg-orange-400';
    if (percentage > 0) return 'bg-red-400';
    return 'bg-muted';
  };

  return (
    <Card className="bg-gradient-cream p-5 shadow-warm border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          This Week
        </h3>
        <Badge variant="outline" className="text-xs">
          <TrendingUp className="h-3 w-3 mr-1" />
          {overallAdherence}%
        </Badge>
      </div>

      <div className="space-y-3">
        {weeklyData.map((day, index) => {
          const isToday = new Date().getDay() === day.date.getDay();
          
          return (
            <div key={index} className="flex items-center gap-3">
              <div className={`text-xs font-medium w-8 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {day.dayName}
              </div>
              
              {/* Progress Dots */}
              <div className="flex gap-1 flex-1">
                {day.totalDoses > 0 ? (
                  Array.from({ length: Math.min(day.totalDoses, 8) }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-2 rounded-full ${
                        i < day.takenDoses ? getAdherenceBg(day.percentage) : 'bg-muted'
                      }`}
                    />
                  ))
                ) : (
                  <div className="h-2 w-2 rounded-full bg-muted" />
                )}
              </div>
              
              {/* Count */}
              <div className={`text-xs font-medium ${getAdherenceColor(day.percentage)}`}>
                {day.totalDoses > 0 ? `${day.takenDoses}/${day.totalDoses}` : '—'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Summary */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Weekly Adherence</span>
          <span className={`text-sm font-semibold ${getAdherenceColor(overallAdherence)}`}>
            {overallAdherence}%
          </span>
        </div>
      </div>
    </Card>
  );
};
