import { Schedule, MedicationLog } from '@/hooks/useMedications';
import { DoseGroup } from '@/lib/medicationHelpers';

export const calculateDailyProgress = (
  schedules: Schedule[],
  todayLogs: MedicationLog[]
): number => {
  // Filter to only today's schedules
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const todaySchedules = schedules.filter(schedule => 
    schedule.days_of_week.includes(today)
  );
  
  if (todaySchedules.length === 0) return 0;
  
  const completedCount = todaySchedules.filter(schedule =>
    todayLogs.some(log => log.schedule_id === schedule.id && log.status === 'taken')
  ).length;
  
  return Math.round((completedCount / todaySchedules.length) * 100);
};

export const getDailyStats = (
  schedules: Schedule[],
  todayLogs: MedicationLog[]
) => {
  // Filter to only today's schedules
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  const todaySchedules = schedules.filter(schedule => 
    schedule.days_of_week.includes(today)
  );
  
  const total = todaySchedules.length;
  const completed = todaySchedules.filter(schedule =>
    todayLogs.some(log => log.schedule_id === schedule.id && log.status === 'taken')
  ).length;
  const remaining = total - completed;
  
  return {
    total,
    completed,
    remaining,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  };
};

export const calculateWeeklyAdherence = (
  schedules: Schedule[],
  todayLogs: MedicationLog[]
): number => {
  // Simplified: using today's data
  // Full implementation would query last 7 days
  return calculateDailyProgress(schedules, todayLogs);
};

export const calculateStreak = (todayLogs: MedicationLog[]): number => {
  // Simplified: shows days with activity
  // Full implementation would query consecutive days
  const hasTakenDoses = todayLogs.some(log => log.status === 'taken');
  return hasTakenDoses ? 1 : 0;
};

export const getOnTimePercentage = (
  allDoses: DoseGroup[],
  todayLogs: MedicationLog[],
  currentTime: Date
): number => {
  const completedDoses = allDoses.filter(dose => {
    const scheduleIds = dose.schedules.map(s => s.schedule.id);
    return scheduleIds.every(id => 
      todayLogs.some(log => log.schedule_id === id && log.status === 'taken')
    );
  });

  if (completedDoses.length === 0) return 100;

  const onTimeDoses = completedDoses.filter(dose => {
    const doseTime = new Date();
    const [hours, minutes] = dose.time.split(':').map(Number);
    doseTime.setHours(hours, minutes, 0, 0);
    
    const scheduleIds = dose.schedules.map(s => s.schedule.id);
    const logs = todayLogs.filter(log => scheduleIds.includes(log.schedule_id));
    
    if (logs.length === 0) return false;
    
    const latestLog = logs.reduce((latest, log) => {
      const logTime = new Date(log.taken_at || '');
      const latestTime = new Date(latest.taken_at || '');
      return logTime > latestTime ? log : latest;
    });
    
    const logTime = new Date(latestLog.taken_at || '');
    const timeDiff = (logTime.getTime() - doseTime.getTime()) / (1000 * 60);
    
    return Math.abs(timeDiff) <= 30; // Within 30 minutes
  }).length;

  return Math.round((onTimeDoses / completedDoses.length) * 100);
};
