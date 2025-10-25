import { Medication, Schedule, MedicationLog } from '@/hooks/useMedications';

export const calculateDailyProgress = (
  schedules: Schedule[],
  todayLogs: MedicationLog[]
): number => {
  if (schedules.length === 0) return 0;
  
  const completedCount = schedules.filter(schedule =>
    todayLogs.some(log => log.schedule_id === schedule.id && log.status === 'taken')
  ).length;
  
  return Math.round((completedCount / schedules.length) * 100);
};

export const getDailyStats = (
  schedules: Schedule[],
  todayLogs: MedicationLog[]
) => {
  const total = schedules.length;
  const completed = schedules.filter(schedule =>
    todayLogs.some(log => log.schedule_id === schedule.id && log.status === 'taken')
  ).length;
  const remaining = total - completed;
  
  return {
    total,
    completed,
    remaining,
  };
};

export const calculateWeeklyAdherence = (
  schedules: Schedule[],
  todayLogs: MedicationLog[]
): number => {
  // For now, using today's data as a simplified version
  // In a full implementation, this would query the last 7 days of logs
  return calculateDailyProgress(schedules, todayLogs);
};

export const getMotivationalMessage = (progress: number): string => {
  if (progress === 100) {
    return "Perfect day! You're unstoppable! 💪";
  } else if (progress >= 80) {
    return "You're crushing it today! Keep going! 🌟";
  } else if (progress >= 50) {
    return "Great progress! You're doing amazing! ⭐";
  } else if (progress >= 25) {
    return "You've got this! Keep up the momentum! 🚀";
  } else if (progress > 0) {
    return "Every dose matters. You're on the right track! 💙";
  } else {
    return "Ready to start your day? Let's do this! ✨";
  }
};

export const getTimeBasedGradient = (currentTime: Date): string => {
  const hour = currentTime.getHours();
  
  if (hour >= 5 && hour < 12) {
    // Morning - Sunrise gradient
    return "from-orange-400/20 via-yellow-400/20 to-pink-400/20";
  } else if (hour >= 12 && hour < 17) {
    // Afternoon - Sky gradient
    return "from-blue-400/20 via-cyan-400/20 to-blue-500/20";
  } else if (hour >= 17 && hour < 21) {
    // Evening - Sunset gradient
    return "from-purple-400/20 via-orange-400/20 to-pink-400/20";
  } else {
    // Night - Deep gradient
    return "from-indigo-500/20 via-purple-500/20 to-blue-600/20";
  }
};

export const getGreetingEmoji = (currentTime: Date): string => {
  const hour = currentTime.getHours();
  
  if (hour >= 5 && hour < 12) return "☀️";
  if (hour >= 12 && hour < 17) return "🌤️";
  if (hour >= 17 && hour < 21) return "🌅";
  return "🌙";
};

export const calculateStreak = (todayLogs: MedicationLog[]): number => {
  // Simplified streak calculation - shows 1 if any doses taken today
  // In a full implementation, this would query medication_logs for past days
  const hasTakenDoses = todayLogs.some(log => log.status === 'taken');
  return hasTakenDoses ? 1 : 0;
};
