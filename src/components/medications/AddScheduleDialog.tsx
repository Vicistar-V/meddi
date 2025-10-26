import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Schedule } from '@/hooks/useMedications';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicationId: string;
  medicationName: string;
  existingSchedules: Schedule[];
  onSave: (medicationId: string, scheduleData: Omit<Schedule, 'id' | 'user_id'>) => Promise<void>;
}

const daysOfWeek = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' }
];

export const AddScheduleDialog = ({
  open,
  onOpenChange,
  medicationId,
  medicationName,
  existingSchedules,
  onSave,
}: AddScheduleDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    time: '08:00',
    days: [] as string[],
  });

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleSave = async () => {
    // Validation
    if (formData.days.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select at least one day.',
      });
      return;
    }

    // Check for duplicate schedules (same time + overlapping days)
    const isDuplicate = existingSchedules.some(schedule => {
      const scheduleDays = schedule.days_of_week as string[];
      const hasOverlappingDays = formData.days.some(day => scheduleDays.includes(day));
      return schedule.time_to_take === formData.time && hasOverlappingDays;
    });

    if (isDuplicate) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Schedule',
        description: 'A schedule with this time and days already exists.',
      });
      return;
    }

    setIsLoading(true);
    try {
      await onSave(medicationId, {
        medication_id: medicationId,
        time_to_take: formData.time,
        days_of_week: formData.days,
      });
      
      // Reset form
      setFormData({ time: '08:00', days: [] });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Schedule</DialogTitle>
          <DialogDescription>
            Add a new dosage schedule for {medicationName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="time">Time to Take</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Days of Week</Label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map(day => (
                <Button
                  key={day.value}
                  type="button"
                  size="sm"
                  variant={formData.days.includes(day.value) ? 'default' : 'outline'}
                  onClick={() => toggleDay(day.value)}
                >
                  {day.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Select the days when you need to take this medication
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
