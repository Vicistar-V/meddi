import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface WeekData {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  label: string;
  totalExpected: number;
  totalTaken: number;
  adherence: number;
  days: {
    date: Date;
    expected: number;
    taken: number;
    adherence: number;
  }[];
}

interface WeeklyAdherenceCardProps {
  week: WeekData;
}

export const WeeklyAdherenceCard = ({ week }: WeeklyAdherenceCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getAdherenceColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-success-light text-success-dark border-success';
    if (percentage >= 50) return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-rose-50 text-rose-800 border-rose-200';
  };

  return (
    <Card className="bg-gradient-latte shadow-vanilla hover:shadow-warm transition-shadow">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex w-full items-center justify-between hover:opacity-70 transition-opacity">
            <div className="flex-1 text-left">
              <CardTitle className="text-lg">{week.label}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {format(week.weekStart, 'MMM d')} - {format(week.weekEnd, 'MMM d, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold border-2",
                getAdherenceColor(week.adherence)
              )}>
                {week.adherence}%
              </div>
              <ChevronDown className={cn(
                "h-5 w-5 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CardContent className="pb-4">
          {/* Visual Bar */}
          <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full transition-all duration-500",
                week.adherence >= 80 ? "bg-success" : week.adherence >= 50 ? "bg-amber-500" : "bg-rose-500"
              )}
              style={{ width: `${week.adherence}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{week.totalTaken} of {week.totalExpected} doses taken</span>
            <span>{week.totalExpected - week.totalTaken} missed</span>
          </div>

          <CollapsibleContent>
            <div className="mt-4 space-y-2 border-t pt-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground">Daily Breakdown</p>
              {week.days.map(day => (
                <div key={day.date.toISOString()} className="flex items-center justify-between rounded-lg border bg-background/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-3 w-3 rounded-full",
                      day.adherence === 100 ? "bg-success" :
                      day.adherence >= 50 ? "bg-amber-500" :
                      day.expected === 0 ? "bg-muted" : "bg-rose-500"
                    )} />
                    <span className="font-medium">
                      {format(day.date, 'EEEE, MMM d')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold">{day.taken}/{day.expected}</span>
                    {day.expected > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({day.adherence}%)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};
