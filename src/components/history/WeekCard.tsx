import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DayButton } from './DayButton';
import type { WeekData } from '@/hooks/useSimpleHistory';

interface WeekCardProps {
  weekData: WeekData;
  onDayClick: (date: Date) => void;
}

export const WeekCard = ({ weekData, onDayClick }: WeekCardProps) => {
  return (
    <Card className="bg-gradient-latte border-none shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{weekData.weekLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekData.days.map((day) => (
            <DayButton
              key={day.date.toISOString()}
              date={day.date}
              adherence={day.adherence}
              onClick={() => onDayClick(day.date)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
