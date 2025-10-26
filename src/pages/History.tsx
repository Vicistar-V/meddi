import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { HistoryHeroStats } from '@/components/history/HistoryHeroStats';
import { WeeklyAdherenceCard } from '@/components/history/WeeklyAdherenceCard';
import { InsightsCard } from '@/components/history/InsightsCard';
import { CompactCalendar } from '@/components/history/CompactCalendar';
import { DayDetailSheet } from '@/components/history/DayDetailSheet';
import { useMedications } from '@/hooks/useMedications';
import { isSameDay, parseISO } from 'date-fns';

export default function History() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  const { 
    streak, 
    monthlyAdherence, 
    weeklyBreakdown, 
    adherencePatterns,
    dailyAdherence,
    historicalLogs,
    schedules
  } = useHistoricalData(90);

  const { medications } = useMedications();

  // Get selected date details
  const selectedDateLogs = selectedDate
    ? historicalLogs.filter(log => {
        const logDate = parseISO(log.taken_at);
        return isSameDay(logDate, selectedDate);
      })
    : [];

  const selectedDateSchedules = selectedDate
    ? schedules.filter(schedule => {
        const dayOfWeek = selectedDate
          .toLocaleDateString('en-US', { weekday: 'long' })
          .toLowerCase();
        return (schedule.days_of_week as string[]).includes(dayOfWeek);
      })
    : [];

  const selectedDateMedications = selectedDateSchedules.map(schedule => {
    const medication = medications.find(m => m.id === schedule.medication_id);
    const wasTaken = selectedDateLogs.some(log => log.schedule_id === schedule.id && log.status === 'taken');

    return {
      schedule,
      medication,
      wasTaken
    };
  }).filter(item => item.medication);

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      {/* Hero Stats */}
      <HistoryHeroStats 
        adherence={monthlyAdherence}
        streak={streak}
        weeklyData={weeklyBreakdown.map(w => ({ label: w.label, adherence: w.adherence }))}
      />
      
      {/* Compact Calendar */}
      <CompactCalendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        adherenceData={dailyAdherence}
      />
      
      {/* Weekly Breakdown */}
      <div className="container mx-auto px-4 py-4 space-y-4">
        <div className="mb-2">
          <h2 className="text-xl font-bold">Weekly Breakdown</h2>
          <p className="text-sm text-muted-foreground">Your adherence over the past 4 weeks</p>
        </div>
        {weeklyBreakdown.map(week => (
          <WeeklyAdherenceCard key={week.id} week={week} />
        ))}
      </div>
      
      {/* Insights */}
      <div className="container mx-auto px-4 py-4">
        <InsightsCard patterns={adherencePatterns} />
      </div>
      
      {/* Day Detail Sheet */}
      <DayDetailSheet 
        date={selectedDate || null}
        medications={selectedDateMedications}
        onClose={() => setSelectedDate(undefined)}
      />
      
      <BottomNav />
    </div>
  );
}
