import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthProvider';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  eachWeekOfInterval,
  format, 
  isSameDay,
  parseISO,
  subDays,
  differenceInDays
} from 'date-fns';

export const useHistoricalData = (timeframe: 30 | 60 | 90 = 30) => {
  const { user } = useAuth();

  // Fetch historical logs
  const { data: historicalLogs = [] } = useQuery({
    queryKey: ['historical-logs', user?.id, timeframe],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const startDate = subDays(new Date(), timeframe);
      const { data, error } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('taken_at', startDate.toISOString())
        .order('taken_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch all schedules
  const { data: schedules = [] } = useQuery({
    queryKey: ['schedules', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Calculate actual streak
  const calculateStreak = useMemo(() => {
    if (historicalLogs.length === 0 || schedules.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (true) {
      const dayOfWeek = format(currentDate, 'EEEE').toLowerCase();
      const daySchedules = schedules.filter(s => 
        (s.days_of_week as string[]).includes(dayOfWeek)
      );

      if (daySchedules.length === 0) {
        currentDate = subDays(currentDate, 1);
        continue;
      }

      const dayLogs = historicalLogs.filter(log => {
        const logDate = parseISO(log.taken_at);
        return isSameDay(logDate, currentDate) && log.status === 'taken';
      });

      const scheduleIds = daySchedules.map(s => s.id);
      const takenCount = dayLogs.filter(log => scheduleIds.includes(log.schedule_id)).length;

      if (takenCount === daySchedules.length) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }

      if (differenceInDays(new Date(), currentDate) > 90) break;
    }

    return streak;
  }, [historicalLogs, schedules]);

  // Calculate monthly adherence
  const monthlyAdherence = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    let totalExpected = 0;
    let totalTaken = 0;

    daysInMonth.forEach(day => {
      if (day > new Date()) return;

      const dayOfWeek = format(day, 'EEEE').toLowerCase();
      const daySchedules = schedules.filter(s => 
        (s.days_of_week as string[]).includes(dayOfWeek)
      );

      totalExpected += daySchedules.length;

      const dayLogs = historicalLogs.filter(log => {
        const logDate = parseISO(log.taken_at);
        return isSameDay(logDate, day) && log.status === 'taken';
      });

      const scheduleIds = daySchedules.map(s => s.id);
      totalTaken += dayLogs.filter(log => scheduleIds.includes(log.schedule_id)).length;
    });

    return totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 0;
  }, [historicalLogs, schedules]);

  // Get weekly breakdown (last 4 weeks)
  const weeklyBreakdown = useMemo(() => {
    const now = new Date();
    const weeks: any[] = [];

    for (let i = 0; i < 4; i++) {
      const weekStart = startOfWeek(subDays(now, i * 7));
      const weekEnd = endOfWeek(subDays(now, i * 7));
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

      let totalExpected = 0;
      let totalTaken = 0;

      daysInWeek.forEach(day => {
        if (day > now) return;

        const dayOfWeek = format(day, 'EEEE').toLowerCase();
        const daySchedules = schedules.filter(s => 
          (s.days_of_week as string[]).includes(dayOfWeek)
        );

        totalExpected += daySchedules.length;

        const dayLogs = historicalLogs.filter(log => {
          const logDate = parseISO(log.taken_at);
          return isSameDay(logDate, day) && log.status === 'taken';
        });

        const scheduleIds = daySchedules.map(s => s.id);
        totalTaken += dayLogs.filter(log => scheduleIds.includes(log.schedule_id)).length;
      });

      const adherence = totalExpected > 0 ? Math.round((totalTaken / totalExpected) * 100) : 0;

      weeks.push({
        id: `week-${i}`,
        weekStart,
        weekEnd,
        label: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : `${i + 1} Weeks Ago`,
        totalExpected,
        totalTaken,
        adherence,
        days: daysInWeek.map(day => {
          const dayOfWeek = format(day, 'EEEE').toLowerCase();
          const daySchedules = schedules.filter(s => 
            (s.days_of_week as string[]).includes(dayOfWeek)
          );

          const dayLogs = historicalLogs.filter(log => {
            const logDate = parseISO(log.taken_at);
            return isSameDay(logDate, day) && log.status === 'taken';
          });

          const scheduleIds = daySchedules.map(s => s.id);
          const taken = dayLogs.filter(log => scheduleIds.includes(log.schedule_id)).length;
          const expected = daySchedules.length;

          return {
            date: day,
            expected,
            taken,
            adherence: expected > 0 ? Math.round((taken / expected) * 100) : 0
          };
        })
      });
    }

    return weeks;
  }, [historicalLogs, schedules]);

  // Get adherence patterns
  const adherencePatterns = useMemo(() => {
    if (historicalLogs.length === 0) return null;

    // Best time of day
    const timeSlots = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    historicalLogs.forEach(log => {
      if (log.status !== 'taken') return;
      const hour = parseISO(log.taken_at).getHours();
      if (hour >= 5 && hour < 12) timeSlots.morning++;
      else if (hour >= 12 && hour < 17) timeSlots.afternoon++;
      else if (hour >= 17 && hour < 21) timeSlots.evening++;
      else timeSlots.night++;
    });

    const bestTime = Object.entries(timeSlots).reduce((a, b) => 
      timeSlots[a[0] as keyof typeof timeSlots] > timeSlots[b[0] as keyof typeof timeSlots] ? a : b
    )[0];

    // Day with highest adherence
    const dayAdherence = { sun: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 };
    historicalLogs.forEach(log => {
      if (log.status !== 'taken') return;
      const day = format(parseISO(log.taken_at), 'EEE').toLowerCase();
      dayAdherence[day as keyof typeof dayAdherence]++;
    });

    const bestDay = Object.entries(dayAdherence).reduce((a, b) => 
      dayAdherence[a[0] as keyof typeof dayAdherence] > dayAdherence[b[0] as keyof typeof dayAdherence] ? a : b
    )[0];

    return {
      bestTime,
      bestDay,
      totalDosesTaken: historicalLogs.filter(l => l.status === 'taken').length
    };
  }, [historicalLogs]);

  // Get daily adherence data for calendar
  const dailyAdherence = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return daysInMonth.map(day => {
      const dayOfWeek = format(day, 'EEEE').toLowerCase();
      const daySchedules = schedules.filter(s => 
        (s.days_of_week as string[]).includes(dayOfWeek)
      );

      const dayLogs = historicalLogs.filter(log => {
        const logDate = parseISO(log.taken_at);
        return isSameDay(logDate, day) && log.status === 'taken';
      });

      const scheduleIds = daySchedules.map(s => s.id);
      const taken = dayLogs.filter(log => scheduleIds.includes(log.schedule_id)).length;
      const expected = daySchedules.length;

      return {
        date: day,
        expected,
        taken,
        adherence: expected > 0 ? Math.round((taken / expected) * 100) : 0
      };
    });
  }, [historicalLogs, schedules]);

  return {
    historicalLogs,
    schedules,
    streak: calculateStreak,
    monthlyAdherence,
    weeklyBreakdown,
    adherencePatterns,
    dailyAdherence
  };
};
