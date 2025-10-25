import { DoseGroup, getDoseStatus } from './medicationHelpers';
import { MedicationLog } from '@/hooks/useMedications';

/**
 * Get relative time string like "in 2 hours", "5 min ago", "now"
 */
export function getRelativeTime(scheduleTime: string, currentTime: Date = new Date()): string {
  const [hours, minutes] = scheduleTime.split(':').map(Number);
  const scheduleDate = new Date(currentTime);
  scheduleDate.setHours(hours, minutes, 0, 0);

  const diffMs = scheduleDate.getTime() - currentTime.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  // Past times
  if (diffMinutes < -60) {
    const hoursAgo = Math.abs(Math.round(diffMinutes / 60));
    return `${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago`;
  }
  if (diffMinutes < -5) {
    return `${Math.abs(diffMinutes)} min ago`;
  }
  if (diffMinutes < 0) {
    return 'just now';
  }

  // Current/Near future
  if (diffMinutes <= 5) {
    return 'due now';
  }
  if (diffMinutes <= 30) {
    return `in ${diffMinutes} min`;
  }
  if (diffMinutes < 60) {
    return 'soon';
  }

  // Future times
  const futureHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;
  
  if (remainingMinutes === 0) {
    return `in ${futureHours} ${futureHours === 1 ? 'hour' : 'hours'}`;
  }
  if (futureHours === 1) {
    return `in 1h ${remainingMinutes}m`;
  }
  return `in ${futureHours} hours`;
}

/**
 * Get time context for grouping doses
 */
export function getTimeContext(scheduleTime: string, currentTime: Date = new Date()): 'now' | 'next' | 'later' {
  const [hours, minutes] = scheduleTime.split(':').map(Number);
  const scheduleDate = new Date(currentTime);
  scheduleDate.setHours(hours, minutes, 0, 0);

  const diffMs = scheduleDate.getTime() - currentTime.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  // Current dose (within 5 minutes before or after)
  if (diffMinutes >= -5 && diffMinutes <= 30) {
    return 'now';
  }

  // Next doses (within 2 hours)
  if (diffMinutes > 30 && diffMinutes <= 120) {
    return 'next';
  }

  // Later today
  return 'later';
}

/**
 * Group doses by proximity to current time
 */
export function groupDosesByProximity(
  doses: DoseGroup[],
  todayLogs: MedicationLog[],
  currentTime: Date = new Date()
): {
  now: DoseGroup[];
  next: DoseGroup[];
  later: DoseGroup[];
  overdue: DoseGroup[];
} {
  const groups = {
    now: [] as DoseGroup[],
    next: [] as DoseGroup[],
    later: [] as DoseGroup[],
    overdue: [] as DoseGroup[],
  };

  doses.forEach(dose => {
    // Filter out completed schedules - only show incomplete ones
    const incompleteSchedules = dose.schedules.filter(item => {
      const isLogged = todayLogs.some(
        log => log.schedule_id === item.schedule.id && log.status === 'taken'
      );
      return !isLogged;
    });

    // Skip if all schedules are completed
    if (incompleteSchedules.length === 0) {
      return;
    }

    // Create a new dose group with only incomplete schedules
    const filteredDose: DoseGroup = {
      ...dose,
      schedules: incompleteSchedules
    };

    // Get status for the filtered dose
    const scheduleIds = filteredDose.schedules.map(s => s.schedule.id);
    const status = getDoseStatus(filteredDose.time, scheduleIds, todayLogs, currentTime);
    
    const context = getTimeContext(filteredDose.time, currentTime);
    
    // Check if dose is overdue based on status
    if (status === 'missed') {
      groups.overdue.push(filteredDose);
    } else {
      groups[context].push(filteredDose);
    }
  });

  return groups;
}

/**
 * Check if a time has passed
 */
export function hasTimePassed(scheduleTime: string, currentTime: Date = new Date()): boolean {
  const [hours, minutes] = scheduleTime.split(':').map(Number);
  const scheduleDate = new Date(currentTime);
  scheduleDate.setHours(hours, minutes, 0, 0);

  return scheduleDate.getTime() < currentTime.getTime();
}

/**
 * Calculate time elapsed since a scheduled time (for overdue doses)
 */
export function calculateTimeAgo(scheduleTime: string, currentTime: Date = new Date()): string {
  const [schedHour, schedMin] = scheduleTime.split(':').map(Number);
  const schedDate = new Date(currentTime);
  schedDate.setHours(schedHour, schedMin, 0, 0);
  
  const diffMs = currentTime.getTime() - schedDate.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 0) return 'not yet'; // Future dose
  if (diffMinutes < 60) return `${diffMinutes} min`;
  
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
