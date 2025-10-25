import { useMedications } from '@/hooks/useMedications';
import { PillCard } from './PillCard';
import { useToast } from '@/hooks/use-toast';

export const TodaySchedule = () => {
  const { medications, schedules, logMedication } = useMedications();
  const { toast } = useToast();

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();

  const todaySchedules = schedules.filter(schedule => 
    schedule.days_of_week.includes(today)
  );

  const scheduledMedications = todaySchedules.map(schedule => {
    const medication = medications.find(m => m.id === schedule.medication_id);
    return {
      schedule,
      medication
    };
  }).filter(item => item.medication);

  const handleMarkTaken = async (scheduleId: string) => {
    try {
      await logMedication.mutateAsync({
        schedule_id: scheduleId,
        status: 'taken'
      });
      toast({
        title: 'Medication logged',
        description: 'Great job staying on track!'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log medication'
      });
    }
  };

  if (scheduledMedications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No medications scheduled for today</p>
        <p className="text-sm mt-2">Add your first medication to get started</p>
      </div>
    );
  }

  const groupedByTime = scheduledMedications.reduce((acc, item) => {
    const hour = parseInt(item.schedule.time_to_take.split(':')[0]);
    let timeOfDay = 'Evening';
    if (hour < 12) timeOfDay = 'Morning';
    else if (hour < 17) timeOfDay = 'Afternoon';

    if (!acc[timeOfDay]) acc[timeOfDay] = [];
    acc[timeOfDay].push(item);
    return acc;
  }, {} as Record<string, typeof scheduledMedications>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedByTime).map(([timeOfDay, items]) => (
        <div key={timeOfDay}>
          <h3 className="mb-3 text-lg font-semibold">{timeOfDay}</h3>
          <div className="space-y-3">
            {items.map(({ schedule, medication }) => (
              <PillCard
                key={schedule.id}
                medicationName={medication!.name}
                dosage={medication!.dosage}
                time={schedule.time_to_take}
                status="upcoming"
                onMarkTaken={() => handleMarkTaken(schedule.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};