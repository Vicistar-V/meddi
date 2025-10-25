import { Check, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DoseGroup, getDoseStatus, formatTimeDisplay, TimeOfDay } from '@/lib/medicationHelpers';
import { MedicationLog } from '@/hooks/useMedications';

interface DayTimelineProps {
  dosesTimeline: Map<TimeOfDay, DoseGroup[]>;
  todayLogs: MedicationLog[];
  currentTime?: Date;
  onDoseClick?: (dose: DoseGroup) => void;
}

export const DayTimeline = ({ 
  dosesTimeline, 
  todayLogs,
  currentTime = new Date(),
  onDoseClick 
}: DayTimelineProps) => {
  const timeOfDayOrder: TimeOfDay[] = ['Morning', 'Afternoon', 'Evening'];

  const hasAnyDoses = Array.from(dosesTimeline.values()).some(doses => doses.length > 0);

  if (!hasAnyDoses) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Clock className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">
          No medications scheduled for today
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {timeOfDayOrder.map(timeOfDay => {
        const doses = dosesTimeline.get(timeOfDay) || [];
        
        if (doses.length === 0) return null;

        return (
          <div key={timeOfDay} className="relative">
            {/* Time of Day Label */}
            <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {timeOfDay}
            </h3>

            {/* Timeline */}
            <div className="relative space-y-4 pl-8">
              {/* Vertical Line */}
              <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />

              {doses.map((dose, index) => {
                const scheduleIds = dose.schedules.map(s => s.schedule.id);
                const status = getDoseStatus(dose.time, scheduleIds, todayLogs, currentTime);
                const pillCount = dose.schedules.length;

                return (
                  <div
                    key={dose.time}
                    className={cn(
                      'relative cursor-pointer transition-all',
                      onDoseClick && 'hover:translate-x-1'
                    )}
                    onClick={() => onDoseClick?.(dose)}
                  >
                    {/* Bubble */}
                    <div
                      className={cn(
                        'absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                        status === 'completed' && 'border-green-500 bg-green-500',
                        status === 'current' && 'border-primary bg-primary shadow-lg shadow-primary/30',
                        status === 'upcoming' && 'border-border bg-background',
                        status === 'missed' && 'border-red-500 bg-red-500'
                      )}
                    >
                      {status === 'completed' && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                      {status === 'current' && (
                        <Clock className="h-4 w-4 text-primary-foreground" />
                      )}
                      {status === 'upcoming' && (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      {status === 'missed' && (
                        <AlertCircle className="h-4 w-4 text-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="ml-12">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={cn(
                            'font-semibold',
                            status === 'completed' && 'text-green-700 dark:text-green-400',
                            status === 'current' && 'text-primary',
                            status === 'missed' && 'text-red-700 dark:text-red-400'
                          )}>
                            {formatTimeDisplay(dose.time)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {pillCount} {pillCount === 1 ? 'pill' : 'pills'}
                          </p>
                        </div>

                        {status === 'completed' && (
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            Completed
                          </span>
                        )}
                        {status === 'missed' && (
                          <span className="text-xs font-medium text-red-600 dark:text-red-400">
                            Missed
                          </span>
                        )}
                      </div>

                      {/* Medication Names (preview) */}
                      <div className="mt-1 text-xs text-muted-foreground">
                        {dose.schedules.slice(0, 2).map(item => item.medication.name).join(', ')}
                        {dose.schedules.length > 2 && ` +${dose.schedules.length - 2} more`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
