import { Medication, Schedule, MedicationLog } from '@/hooks/useMedications';

export type TimeOfDay = 'Morning' | 'Afternoon' | 'Evening';
export type DoseStatus = 'completed' | 'current' | 'upcoming' | 'missed';

export interface DoseGroup {
  time: string;
  schedules: Array<{
    schedule: Schedule;
    medication: Medication;
  }>;
  timeOfDay: TimeOfDay;
}

/**
 * Get the next dose that needs to be taken
 */
export function getNextDose(
  medications: Medication[],
  schedules: Schedule[],
  todayLogs: MedicationLog[],
  currentTime: Date = new Date()
): DoseGroup | null {
  const today = currentTime.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  
  // Filter schedules for today
  const todaySchedules = schedules.filter(schedule => 
    schedule.days_of_week.includes(today)
  );

  // Group by time
  const doseGroups = new Map<string, DoseGroup>();
  
  todaySchedules.forEach(schedule => {
    const medication = medications.find(m => m.id === schedule.medication_id);
    if (!medication) return;
    
    const hasBeenTaken = todayLogs.some(log => log.schedule_id === schedule.id);
    if (hasBeenTaken) return; // Skip already taken
    
    if (!doseGroups.has(schedule.time_to_take)) {
      doseGroups.set(schedule.time_to_take, {
        time: schedule.time_to_take,
        schedules: [],
        timeOfDay: getTimeOfDayFromTime(schedule.time_to_take)
      });
    }
    
    doseGroups.get(schedule.time_to_take)!.schedules.push({
      schedule,
      medication
    });
  });

  // Sort by time
  const sortedDoses = Array.from(doseGroups.values()).sort((a, b) => 
    a.time.localeCompare(b.time)
  );

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

  // Separate into overdue and upcoming doses
  const overdueDoses = sortedDoses.filter(dose => {
    const scheduleIds = dose.schedules.map(s => s.schedule.id);
    const doseStatus = getDoseStatus(dose.time, scheduleIds, todayLogs, currentTime);
    return doseStatus === 'missed';
  });
  
  const upcomingDoses = sortedDoses.filter(dose => dose.time >= currentTimeStr);
  
  // PRIORITY: Show overdue first (most recent overdue)
  if (overdueDoses.length > 0) {
    return overdueDoses[overdueDoses.length - 1]; // Most recent overdue
  }
  
  // Otherwise show next upcoming
  return upcomingDoses[0] || null;
}

/**
 * Get all doses grouped by time of day for timeline view
 */
export function getDosesByTimeOfDay(
  medications: Medication[],
  schedules: Schedule[],
  todayLogs: MedicationLog[],
  currentTime: Date = new Date()
): Map<TimeOfDay, DoseGroup[]> {
  const today = currentTime.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
  
  const todaySchedules = schedules.filter(schedule => 
    schedule.days_of_week.includes(today)
  );

  const doseGroups = new Map<string, DoseGroup>();
  
  todaySchedules.forEach(schedule => {
    const medication = medications.find(m => m.id === schedule.medication_id);
    if (!medication) return;
    
    if (!doseGroups.has(schedule.time_to_take)) {
      doseGroups.set(schedule.time_to_take, {
        time: schedule.time_to_take,
        schedules: [],
        timeOfDay: getTimeOfDayFromTime(schedule.time_to_take)
      });
    }
    
    doseGroups.get(schedule.time_to_take)!.schedules.push({
      schedule,
      medication
    });
  });

  // Group by time of day
  const byTimeOfDay = new Map<TimeOfDay, DoseGroup[]>();
  byTimeOfDay.set('Morning', []);
  byTimeOfDay.set('Afternoon', []);
  byTimeOfDay.set('Evening', []);

  Array.from(doseGroups.values())
    .sort((a, b) => a.time.localeCompare(b.time))
    .forEach(dose => {
      byTimeOfDay.get(dose.timeOfDay)!.push(dose);
    });

  return byTimeOfDay;
}

/**
 * Get the status of a dose
 */
export function getDoseStatus(
  doseTime: string,
  scheduleIds: string[],
  todayLogs: MedicationLog[],
  currentTime: Date = new Date()
): DoseStatus {
  // Check if all schedules in this dose have been logged
  const allTaken = scheduleIds.every(scheduleId => 
    todayLogs.some(log => log.schedule_id === scheduleId)
  );
  
  if (allTaken) return 'completed';

  // Parse dose time
  const [doseHour, doseMinute] = doseTime.split(':').map(Number);
  const doseDate = new Date(currentTime);
  doseDate.setHours(doseHour, doseMinute, 0, 0);

  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;
  const doseTimeMinutes = doseHour * 60 + doseMinute;

  // Check if missed (30 minute grace period)
  if (currentTimeMinutes > doseTimeMinutes + 30) {
    return 'missed';
  }

  // Check if current (within 30 minutes before or after)
  if (Math.abs(currentTimeMinutes - doseTimeMinutes) <= 30) {
    return 'current';
  }

  return 'upcoming';
}

/**
 * Get personalized greeting based on time of day
 */
export function getGreeting(userName: string | null, currentTime: Date = new Date()): string {
  const hour = currentTime.getHours();
  const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const name = userName || 'there';
  
  return `Good ${timeOfDay}, ${name}!`;
}

/**
 * Calculate human-readable time until dose
 */
export function calculateTimeUntilDose(doseTime: string, currentTime: Date = new Date()): string {
  const [doseHour, doseMinute] = doseTime.split(':').map(Number);
  const doseDate = new Date(currentTime);
  doseDate.setHours(doseHour, doseMinute, 0, 0);

  const diffMs = doseDate.getTime() - currentTime.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 0) return 'now';
  if (diffMinutes < 60) return `in ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
  
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  if (minutes === 0) return `in ${hours} hour${hours === 1 ? '' : 's'}`;
  return `in ${hours}h ${minutes}m`;
}

/**
 * Determine time of day from time string
 */
function getTimeOfDayFromTime(time: string): TimeOfDay {
  const hour = parseInt(time.split(':')[0]);
  
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

/**
 * Format time to display format (e.g., "8:00 AM")
 */
export function formatTimeDisplay(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}
