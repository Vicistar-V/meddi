import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface DailyAdherence {
  date: Date;
  expected: number;
  taken: number;
  adherence: number;
}

interface CompactCalendarProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  adherenceData: DailyAdherence[];
}

export const CompactCalendar = ({ selectedDate, onSelectDate, adherenceData }: CompactCalendarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getAdherenceLevel = (date: Date) => {
    const data = adherenceData.find(d => 
      d.date.toDateString() === date.toDateString()
    );

    if (!data || data.expected === 0) return null;
    
    if (data.adherence === 100) return 'perfect';
    if (data.adherence >= 50) return 'partial';
    return 'missed';
  };

  return (
    <div className="container mx-auto px-4 py-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="bg-gradient-warm-cream shadow-vanilla">
          <CardHeader>
            <CollapsibleTrigger className="flex w-full items-center justify-between hover:opacity-70 transition-opacity">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendar View
              </CardTitle>
              <ChevronDown className={cn(
                "h-5 w-5 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
          </CardHeader>
          
          <CollapsibleContent>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={onSelectDate}
                className="rounded-md border"
                modifiers={{
                  perfect: (date) => getAdherenceLevel(date) === 'perfect',
                  partial: (date) => getAdherenceLevel(date) === 'partial',
                  missed: (date) => getAdherenceLevel(date) === 'missed'
                }}
                modifiersStyles={{
                  perfect: {
                    backgroundColor: 'hsl(var(--success-light))',
                    color: 'hsl(var(--success-dark))',
                    fontWeight: 'bold'
                  },
                  partial: {
                    backgroundColor: 'hsl(38 92% 90%)',
                    color: 'hsl(38 92% 30%)',
                    fontWeight: 'bold'
                  },
                  missed: {
                    backgroundColor: 'hsl(0 86% 95%)',
                    color: 'hsl(0 84% 40%)',
                    fontWeight: 'bold'
                  }
                }}
              />
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-success-light" />
                  <span>Perfect (100%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-amber-100" />
                  <span>Partial (50-99%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-100" />
                  <span>Missed (&lt;50%)</span>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
