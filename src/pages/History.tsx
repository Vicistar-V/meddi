import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { HistoryHeroStats } from '@/components/history/HistoryHeroStats';
import { WeeklyAdherenceCard } from '@/components/history/WeeklyAdherenceCard';
import { InsightsCard } from '@/components/history/InsightsCard';
import { CompactCalendar } from '@/components/history/CompactCalendar';
import { DayDetailSheet } from '@/components/history/DayDetailSheet';
import { DateRangeFilter } from '@/components/history/DateRangeFilter';
import { useMedications } from '@/hooks/useMedications';
import { isSameDay, parseISO, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

export default function History() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  
  const { 
    streak, 
    rangeAdherence, 
    weeklyBreakdown, 
    adherencePatterns,
    dailyAdherence,
    historicalLogs,
    schedules
  } = useHistoricalData(dateRange);

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

  const presets = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      {/* Date Range Filter */}
      <div className="container mx-auto px-4 pt-6">
        <DateRangeFilter 
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          presets={presets}
        />
      </div>
      
      {/* Hero Stats */}
      <HistoryHeroStats 
        adherence={rangeAdherence}
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
