import { useState } from 'react';
import { Clock, Sparkles, CheckCircle2, Calendar } from 'lucide-react';
import { DoseGroup, getDoseStatus } from '@/lib/medicationHelpers';
import { MedicationLog } from '@/hooks/useMedications';
import { groupDosesByProximity } from '@/lib/timeHelpers';
import { DailyProgress } from '@/components/timeline/DailyProgress';
import { TimelineSection } from '@/components/timeline/TimelineSection';
import { DoseCard } from '@/components/timeline/DoseCard';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface DayTimelineProps {
  dosesTimeline: Map<string, DoseGroup[]>;
  todayLogs: MedicationLog[];
  currentTime?: Date;
  onDoseComplete?: () => void;
}

export const DayTimeline = ({ 
  dosesTimeline, 
  todayLogs,
  currentTime = new Date(),
  onDoseComplete
}: DayTimelineProps) => {
  const [completedOpen, setCompletedOpen] = useState(false);

  // Get all doses in a flat array
  const allDoses = Array.from(dosesTimeline.values()).flat();

  if (allDoses.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed bg-gradient-to-br from-background to-secondary/20 p-12 text-center">
        <div className="mx-auto max-w-sm space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">All Clear for Today!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              You have no medications scheduled right now.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats for all doses
  const doseStatuses = allDoses.map(dose => {
    const scheduleIds = dose.schedules.map(s => s.schedule.id);
    return getDoseStatus(dose.time, scheduleIds, todayLogs, currentTime);
  });

  const totalDoses = allDoses.length;
  const completedDoses = doseStatuses.filter(s => s === 'completed').length;
  const missedDoses = doseStatuses.filter(s => s === 'missed').length;
  const upcomingDoses = totalDoses - completedDoses - missedDoses;

  // Separate completed from active doses
  const completedDosesList: Array<{ dose: DoseGroup; status: 'completed' }> = [];
  const activeDosesList: Array<{ dose: DoseGroup; status: 'current' | 'upcoming' | 'missed' }> = [];

  allDoses.forEach((dose, index) => {
    const status = doseStatuses[index];
    if (status === 'completed') {
      completedDosesList.push({ dose, status });
    } else {
      activeDosesList.push({ dose, status: status as 'current' | 'upcoming' | 'missed' });
    }
  });

  // Group active doses by proximity
  const activeDoses = activeDosesList.map(item => item.dose);
  const { now, next, later } = groupDosesByProximity(activeDoses, currentTime);

  // Helper to find status for a dose
  const getStatusForDose = (dose: DoseGroup) => {
    const scheduleIds = dose.schedules.map(s => s.schedule.id);
    return getDoseStatus(dose.time, scheduleIds, todayLogs, currentTime);
  };

  // Handle marking a dose as taken
  const handleMarkTaken = async (dose: DoseGroup) => {
    // This will be handled by parent component via onDoseComplete
    onDoseComplete?.();
  };

  // Check if all doses are completed
  const allCompleted = completedDoses === totalDoses;

  if (allCompleted) {
    return (
      <div className="space-y-6">
        {/* Progress */}
        <DailyProgress
          totalDoses={totalDoses}
          completedDoses={completedDoses}
          missedDoses={missedDoses}
          upcomingDoses={upcomingDoses}
        />

        {/* All Done Message */}
        <div className="rounded-xl border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-8 text-center">
          <div className="mx-auto max-w-sm space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 animate-in zoom-in duration-500">
              <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                Amazing Work! 🎉
              </h3>
              <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                You've taken all your medications for today. Keep up the great streak!
              </p>
            </div>
          </div>
        </div>

        {/* Completed Section */}
        <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between hover:bg-secondary/50"
            >
              <span className="text-sm font-medium">
                View completed doses ({completedDoses})
              </span>
              <CheckCircle2 className={cn(
                "h-4 w-4 transition-transform",
                completedOpen && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-4">
            {completedDosesList.map((item, index) => (
              <div 
                key={`${item.dose.time}-${index}`}
                className="animate-in fade-in slide-in-from-top-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <DoseCard
                  dose={item.dose}
                  status={item.status}
                  currentTime={currentTime}
                />
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <DailyProgress
        totalDoses={totalDoses}
        completedDoses={completedDoses}
        missedDoses={missedDoses}
        upcomingDoses={upcomingDoses}
      />

      {/* NOW Section - Current doses */}
      {now.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <TimelineSection 
            title="Now" 
            subtitle="Take these medications"
            icon={<Clock className="h-4 w-4" />}
          >
            {now.map((dose, index) => (
              <div 
                key={`${dose.time}-${index}`}
                className="animate-in fade-in slide-in-from-left-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <DoseCard
                  dose={dose}
                  status={getStatusForDose(dose)}
                  currentTime={currentTime}
                  onMarkTaken={handleMarkTaken}
                />
              </div>
            ))}
          </TimelineSection>
        </div>
      )}

      {/* NEXT Section - Upcoming soon */}
      {next.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <TimelineSection 
            title="Next" 
            subtitle="Coming up soon"
            icon={<Clock className="h-4 w-4" />}
          >
            {next.map((dose, index) => (
              <div 
                key={`${dose.time}-${index}`}
                className="animate-in fade-in slide-in-from-left-4"
                style={{ animationDelay: `${(index + now.length) * 100}ms` }}
              >
                <DoseCard
                  dose={dose}
                  status={getStatusForDose(dose)}
                  currentTime={currentTime}
                  onMarkTaken={handleMarkTaken}
                />
              </div>
            ))}
          </TimelineSection>
        </div>
      )}

      {/* LATER Section - Rest of the day */}
      {later.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <TimelineSection 
            title="Later Today"
            icon={<Calendar className="h-4 w-4" />}
          >
            {later.map((dose, index) => (
              <div 
                key={`${dose.time}-${index}`}
                className="animate-in fade-in slide-in-from-left-4"
                style={{ animationDelay: `${(index + now.length + next.length) * 100}ms` }}
              >
                <DoseCard
                  dose={dose}
                  status={getStatusForDose(dose)}
                  currentTime={currentTime}
                />
              </div>
            ))}
          </TimelineSection>
        </div>
      )}

      {/* COMPLETED Section - Collapsible */}
      {completedDosesList.length > 0 && (
        <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between hover:bg-secondary/50"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Completed ({completedDoses})
              </span>
              <CheckCircle2 className={cn(
                "h-4 w-4 transition-transform",
                completedOpen && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-4">
            {completedDosesList.map((item, index) => (
              <div 
                key={`${item.dose.time}-${index}`}
                className="animate-in fade-in slide-in-from-top-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <DoseCard
                  dose={item.dose}
                  status={item.status}
                  currentTime={currentTime}
                />
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
