import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthProvider';
import { startOfDay, endOfDay, subDays, startOfWeek, format, isSameDay } from 'date-fns';

export type DayAdherence = 'perfect' | 'partial' | 'none' | 'no-schedule';

export interface DayData {
  date: Date;
  adherence: DayAdherence;
  taken: number;
  total: number;
  medications: Array<{
    name: string;
    dosage: string;
    time: string;
    taken: boolean;
  }>;
}

export interface WeekData {
  weekLabel: string;
  startDate: Date;
  days: DayData[];
}

export interface SimpleHistoryData {
  monthlyAdherence: {
    taken: number;
    total: number;
    percentage: number;
  };
  weeklyData: WeekData[];
}

export const useSimpleHistory = (daysBack: number = 30, targetUserId?: string) => {
  const { user } = useAuth();
  
  // Use targetUserId if provided, otherwise use current user's ID
  const userId = targetUserId || user?.id;

  return useQuery({
    queryKey: ['simple-history', userId, daysBack],
    queryFn: async () => {
      if (!userId) return null;

      const endDate = endOfDay(new Date());
      const startDate = startOfDay(subDays(endDate, daysBack - 1));

      // Fetch all logs in the date range
      const { data: logs } = await supabase
        .from('medication_logs')
        .select('*, schedules(*, medications(*))')
        .eq('user_id', userId)
        .gte('taken_at', startDate.toISOString())
        .lte('taken_at', endDate.toISOString());

      // Fetch all schedules
      const { data: schedules } = await supabase
        .from('schedules')
        .select('*, medications(*)')
        .eq('user_id', userId);

      // Process data day by day
      const dayMap = new Map<string, DayData>();
      let monthlyTaken = 0;
      let monthlyTotal = 0;

      // Map day index to day name
      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      
      for (let i = 0; i < daysBack; i++) {
        const currentDate = subDays(new Date(), i);
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        const dayOfWeek = currentDate.getDay();
        const dayName = dayNames[dayOfWeek];

        // Find schedules for this day
        const daySchedules = schedules?.filter((schedule) => {
          const daysOfWeek = schedule.days_of_week as string[];
          return daysOfWeek.includes(dayName);
        }) || [];

        if (daySchedules.length === 0) {
          dayMap.set(dateKey, {
            date: currentDate,
            adherence: 'no-schedule',
            taken: 0,
            total: 0,
            medications: [],
          });
          continue;
        }

        // Check which doses were taken
        const medications = daySchedules.map((schedule) => {
          const log = logs?.find(
            (l) =>
              l.schedule_id === schedule.id &&
              isSameDay(new Date(l.taken_at!), currentDate)
          );

          const taken = !!log;
          if (taken) monthlyTaken++;
          monthlyTotal++;

          return {
            name: schedule.medications?.name || '',
            dosage: schedule.medications?.dosage || '',
            time: schedule.time_to_take,
            taken,
          };
        });

        const takenCount = medications.filter((m) => m.taken).length;
        const totalCount = medications.length;

        let adherence: DayAdherence = 'none';
        if (takenCount === totalCount) adherence = 'perfect';
        else if (takenCount > 0) adherence = 'partial';

        dayMap.set(dateKey, {
          date: currentDate,
          adherence,
          taken: takenCount,
          total: totalCount,
          medications,
        });
      }

      // Group into weeks
      const weeklyData: WeekData[] = [];
      const today = new Date();
      let currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });

      for (let weekIndex = 0; weekIndex < Math.ceil(daysBack / 7); weekIndex++) {
        const weekStart = subDays(currentWeekStart, weekIndex * 7);
        const days: DayData[] = [];

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
          const date = subDays(weekStart, -dayIndex);
          const dateKey = format(date, 'yyyy-MM-dd');
          const dayData = dayMap.get(dateKey);

          if (dayData && date <= today) {
            days.push(dayData);
          }
        }

        if (days.length > 0) {
          let weekLabel = '';
          if (weekIndex === 0) weekLabel = 'This Week';
          else if (weekIndex === 1) weekLabel = 'Last Week';
          else weekLabel = `${weekIndex + 1} Weeks Ago`;

          weeklyData.push({
            weekLabel,
            startDate: weekStart,
            days,
          });
        }
      }

      const data: SimpleHistoryData = {
        monthlyAdherence: {
          taken: monthlyTaken,
          total: monthlyTotal,
          percentage: monthlyTotal > 0 ? Math.round((monthlyTaken / monthlyTotal) * 100) : 0,
        },
        weeklyData,
      };

      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes (history updates less frequently)
    refetchInterval: false, // Don't poll historical data
  });
};
