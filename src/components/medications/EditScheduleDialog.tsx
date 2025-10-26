import { useState, useEffect } from 'react';
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

interface EditScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule | null;
  medicationName: string;
  onSave: (scheduleId: string, updates: Partial<Schedule>) => Promise<void>;
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

export const EditScheduleDialog = ({
  open,
  onOpenChange,
  schedule,
  medicationName,
  onSave,
}: EditScheduleDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    time: '',
    days: [] as string[],
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        time: schedule.time_to_take,
        days: schedule.days_of_week as string[],
      });
    }
  }, [schedule]);

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleSave = async () => {
    if (!schedule) return;

    // Validation
    if (formData.days.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(schedule.id, {
        time_to_take: formData.time,
        days_of_week: formData.days,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!schedule) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Schedule</DialogTitle>
          <DialogDescription>
            Update the schedule for {medicationName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-time">Time to Take</Label>
            <Input
              id="edit-time"
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
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
