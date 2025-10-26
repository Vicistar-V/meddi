import { useMemo } from 'react';
import { Medication, Schedule, MedicationLog } from './useMedications';
import { parseISO, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from 'date-fns';

export const useMedicationAdherence = (
  medications: Medication[],
  schedules: Schedule[],
  logs: MedicationLog[]
) => {
  // Calculate adherence for a specific medication
  const getMedicationAdherence = useMemo(() => {
    return (medicationId: string, timeframe: 'today' | 'week' | 'month' = 'week') => {
      const medSchedules = schedules.filter(s => s.medication_id === medicationId);
      const scheduleIds = medSchedules.map(s => s.id);
      
      let relevantLogs = logs.filter(log => scheduleIds.includes(log.schedule_id));
      
      // Filter by timeframe
      const now = new Date();
      if (timeframe === 'today') {
        relevantLogs = relevantLogs.filter(log => 
          isSameDay(parseISO(log.taken_at || ''), now)
        );
      } else if (timeframe === 'week') {
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        relevantLogs = relevantLogs.filter(log => {
          const logDate = parseISO(log.taken_at || '');
          return logDate >= weekStart && logDate <= weekEnd;
        });
      }
      
      const takenCount = relevantLogs.filter(log => log.status === 'taken').length;
      const totalCount = relevantLogs.length;
      
      return totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;
    };
  }, [schedules, logs]);

  // Get weekly schedule data for visualization
  const getWeeklyScheduleData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return daysOfWeek.map(day => {
      const daySchedules = schedules.filter(schedule => {
        const dayOfWeek = format(day, 'EEEE');
        const daysOfWeekArray = schedule.days_of_week as string[];
        return daysOfWeekArray.includes(dayOfWeek);
      });

      const dayLogs = logs.filter(log => {
        const logDate = parseISO(log.taken_at || '');
        return isSameDay(logDate, day) && daySchedules.some(s => s.id === log.schedule_id);
      });

      const takenCount = dayLogs.filter(log => log.status === 'taken').length;
      const totalCount = daySchedules.length;

      return {
        date: day,
        dayName: format(day, 'EEE'),
        totalDoses: totalCount,
        takenDoses: takenCount,
        percentage: totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0,
      };
    });
  }, [schedules, logs]);

  // Calculate overall adherence
  const overallAdherence = useMemo(() => {
    const takenCount = logs.filter(log => log.status === 'taken').length;
    const totalCount = logs.length;
    return totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;
  }, [logs]);

  return {
    getMedicationAdherence,
    getWeeklyScheduleData,
    overallAdherence,
  };
};
