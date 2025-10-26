import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Clock, AlertCircle, ChevronDown, ChevronUp, Pill } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DoseGroup, getDoseStatus } from '@/lib/medicationHelpers';
import { MedicationLog } from '@/hooks/useMedications';
import { formatTimeDisplay } from '@/lib/medicationHelpers';
import { getRelativeTime } from '@/lib/timeHelpers';

interface CompactTimelineProps {
  dosesTimeline: Map<string, DoseGroup[]>;
  todayLogs: MedicationLog[];
  currentTime?: Date;
  onMarkTaken?: (dose: DoseGroup) => void;
  onMarkIndividual?: (scheduleId: string, medicationName: string) => void;
}

export const CompactTimeline = ({
  dosesTimeline,
  todayLogs,
  currentTime = new Date(),
  onMarkTaken,
  onMarkIndividual
}: CompactTimelineProps) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [markingIndex, setMarkingIndex] = useState<number | null>(null);
  const [markingIndividual, setMarkingIndividual] = useState<string | null>(null);

  // Check if a schedule is already logged
  const isScheduleLogged = (scheduleId: string) => {
    return todayLogs.some(log => log.schedule_id === scheduleId && log.status === 'taken');
  };

  // Flatten all doses
  const allDoses = Array.from(dosesTimeline.values()).flat();

  if (allDoses.length === 0) {
    return null;
  }

  const handleMarkTaken = async (dose: DoseGroup, index: number) => {
    if (!onMarkTaken) return;
    setMarkingIndex(index);
    try {
      await onMarkTaken(dose);
    } finally {
      setMarkingIndex(null);
    }
  };

  const handleMarkIndividualMed = async (scheduleId: string, medicationName: string) => {
    if (!onMarkIndividual) return;
    setMarkingIndividual(scheduleId);
    try {
      await onMarkIndividual(scheduleId, medicationName);
    } finally {
      setMarkingIndividual(null);
    }
  };

  return (
    <Card className="border-2 bg-gradient-cream backdrop-blur-sm">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Today's Schedule
          </h3>
          <span className="text-xs text-muted-foreground">
            {allDoses.length} {allDoses.length === 1 ? 'dose' : 'doses'}
          </span>
        </div>

        {/* Timeline List */}
        <div className="space-y-2">
          {allDoses.map((dose, index) => {
            const scheduleIds = dose.schedules.map(s => s.schedule.id);
            const status = getDoseStatus(dose.time, scheduleIds, todayLogs, currentTime);
            const isExpanded = expandedIndex === index;
            const isMarking = markingIndex === index;
            const pillCount = dose.schedules.length;
            const relativeTime = getRelativeTime(dose.time, currentTime);

            // Status config
            const statusConfig = {
              completed: {
                icon: Check,
                iconBg: 'bg-green-500 text-white',
                textColor: 'text-green-700 dark:text-green-400',
                label: null
              },
              current: {
                icon: Clock,
                iconBg: 'bg-primary text-primary-foreground animate-pulse',
                textColor: 'text-primary',
                label: null
              },
              missed: {
                icon: AlertCircle,
                iconBg: 'bg-orange-500 text-white',
                textColor: 'text-orange-700 dark:text-orange-400',
                label: null
              },
              upcoming: {
                icon: Clock,
                iconBg: 'bg-secondary text-muted-foreground',
                textColor: 'text-muted-foreground',
                label: null
              }
            };

            const config = statusConfig[status];
            const Icon = config.icon;
            const showAction = status === 'current' || status === 'missed';

            return (
              <div
                key={`${dose.time}-${index}`}
                className={cn(
                  "rounded-lg border-2 transition-all duration-200",
                  status === 'completed' && "border-green-500/30 bg-green-50/50 dark:bg-green-950/10",
                  status === 'current' && "border-primary/40 bg-primary/5",
                  status === 'missed' && "border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/10",
                  status === 'upcoming' && "border-border bg-background/50",
                  isExpanded && "ring-2 ring-primary/30"
                )}
              >
                {/* Main Row */}
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                >
                  {/* Status Icon */}
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    config.iconBg
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Time & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className={cn("text-base font-semibold", config.textColor)}>
                        {formatTimeDisplay(dose.time)}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {relativeTime}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {pillCount} {pillCount === 1 ? 'pill' : 'pills'}
                    </p>
                  </div>

                  {/* Action or Expand */}
                  <div className="flex items-center gap-2">
                    {showAction && onMarkTaken && !isExpanded && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkTaken(dose, index);
                        }}
                        disabled={isMarking}
                        className="h-8"
                      >
                        {isMarking ? (
                          <Clock className="h-3 w-3 animate-spin" />
                        ) : (
                          'Take'
                        )}
                      </Button>
                    )}
                    <div className="text-muted-foreground">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div
                    className="border-t px-3 pb-3 pt-3 space-y-3 animate-in slide-in-from-top-2 fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Medication List */}
                    <div className="space-y-2 rounded-lg bg-background/70 p-2">
                      {dose.schedules.map((item, idx) => {
                        const isLogged = isScheduleLogged(item.schedule.id);
                        const isMarkingThis = markingIndividual === item.schedule.id;
                        
                        return (
                          <div
                            key={`${item.schedule.id}-${idx}`}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Pill className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className={cn("font-medium", isLogged && "text-muted-foreground line-through")}>
                                {item.medication.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.medication.dosage}
                              </p>
                              {item.medication.instructions && (
                                <p className="text-xs text-muted-foreground italic mt-0.5">
                                  {item.medication.instructions}
                                </p>
                              )}
                            </div>
                            {showAction && onMarkIndividual && (
                              <Button
                                size="sm"
                                variant={isLogged ? "ghost" : "default"}
                                className="h-7 px-2"
                                onClick={() => handleMarkIndividualMed(item.schedule.id, item.medication.name)}
                                disabled={isLogged || isMarkingThis}
                              >
                                {isLogged ? (
                                  <Check className="h-3 w-3" />
                                ) : isMarkingThis ? (
                                  <Clock className="h-3 w-3 animate-spin" />
                                ) : (
                                  'Take'
                                )}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Button (Expanded) */}
                    {showAction && onMarkTaken && (
                      <Button
                        onClick={() => handleMarkTaken(dose, index)}
                        disabled={isMarking}
                        className="w-full"
                        size="sm"
                      >
                        {isMarking ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Logging...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Mark All as Taken
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
