import { useState } from 'react';
import { Pill } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { MonthlyAdherenceRing } from '@/components/history/MonthlyAdherenceRing';
import { WeekCard } from '@/components/history/WeekCard';
import { DayDetailSheet } from '@/components/history/DayDetailSheet';
import { useSimpleHistory } from '@/hooks/useSimpleHistory';
import type { DayData } from '@/hooks/useSimpleHistory';

export default function History() {
  const { data: historyData, isLoading } = useSimpleHistory(30);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const handleDayClick = (date: Date) => {
    const dayData = historyData?.weeklyData
      .flatMap((week) => week.days)
      .find((day) => day.date.toDateString() === date.toDateString());
    
    if (dayData) {
      setSelectedDay(dayData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-accent/5 pb-20">
        <AppHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading your history...</p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!historyData || historyData.monthlyAdherence.total === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-accent/5 pb-20">
        <AppHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Pill className="h-16 w-16 text-muted-foreground/30" />
            <p className="text-center text-muted-foreground">
              Start tracking to see your medication history
            </p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-accent/5 pb-20">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero: Monthly Adherence */}
        <MonthlyAdherenceRing
          taken={historyData.monthlyAdherence.taken}
          total={historyData.monthlyAdherence.total}
          percentage={historyData.monthlyAdherence.percentage}
        />

        {/* Weekly Timeline */}
        <div className="space-y-4">
          {historyData.weeklyData.map((week, index) => (
            <WeekCard
              key={index}
              weekData={week}
              onDayClick={handleDayClick}
            />
          ))}
        </div>
      </div>

      {/* Day Details Bottom Sheet */}
      <DayDetailSheet
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        dayData={selectedDay}
      />

      <BottomNav />
    </div>
  );
}
