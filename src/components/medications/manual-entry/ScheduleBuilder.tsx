import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Clock, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Schedule {
  id: string;
  label: string;
  time: string;
  days: string[];
}

interface ScheduleBuilderProps {
  schedules: Schedule[];
  onSchedulesChange: (schedules: Schedule[]) => void;
}

const DAYS_OF_WEEK = [
  { value: 'mon', label: 'Mon', full: 'Monday' },
  { value: 'tue', label: 'Tue', full: 'Tuesday' },
  { value: 'wed', label: 'Wed', full: 'Wednesday' },
  { value: 'thu', label: 'Thu', full: 'Thursday' },
  { value: 'fri', label: 'Fri', full: 'Friday' },
  { value: 'sat', label: 'Sat', full: 'Saturday' },
  { value: 'sun', label: 'Sun', full: 'Sunday' }
];

const TIME_PRESETS = [
  { label: 'Morning', time: '08:00', icon: Sunrise },
  { label: 'Noon', time: '12:00', icon: Sun },
  { label: 'Evening', time: '18:00', icon: Sunset },
  { label: 'Bedtime', time: '22:00', icon: Moon }
];

const getTimeOfDayIcon = (time: string) => {
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 5 && hour < 12) return Sunrise;
  if (hour >= 12 && hour < 17) return Sun;
  if (hour >= 17 && hour < 21) return Sunset;
  return Moon;
};

const getTimeOfDayLabel = (time: string) => {
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
};

export const ScheduleBuilder = ({ schedules, onSchedulesChange }: ScheduleBuilderProps) => {
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState<{ time: string; days: string[] }>({
    time: '08:00',
    days: []
  });

  const addSchedule = () => {
    if (newSchedule.days.length === 0) return;

    const schedule: Schedule = {
      id: Math.random().toString(36).substr(2, 9),
      label: getTimeOfDayLabel(newSchedule.time),
      time: newSchedule.time,
      days: newSchedule.days
    };

    onSchedulesChange([...schedules, schedule]);
    setNewSchedule({ time: '08:00', days: [] });
    setIsAddingSchedule(false);
  };

  const removeSchedule = (id: string) => {
    onSchedulesChange(schedules.filter(s => s.id !== id));
  };

  const toggleDay = (day: string) => {
    setNewSchedule(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const selectAllDays = () => {
    setNewSchedule(prev => ({ ...prev, days: DAYS_OF_WEEK.map(d => d.value) }));
  };

  const selectWeekdays = () => {
    setNewSchedule(prev => ({ ...prev, days: ['mon', 'tue', 'wed', 'thu', 'fri'] }));
  };

  const selectWeekends = () => {
    setNewSchedule(prev => ({ ...prev, days: ['sat', 'sun'] }));
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">
        Schedules {schedules.length > 0 && `(${schedules.length})`}
      </Label>

      {/* Existing Schedules */}
      {schedules.length > 0 && (
        <div className="space-y-3">
          {schedules.map((schedule) => {
            const Icon = getTimeOfDayIcon(schedule.time);
            return (
              <Card key={schedule.id} className="p-4 bg-background border-border/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {new Date(`2000-01-01T${schedule.time}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {schedule.days.map(day => {
                          const dayObj = DAYS_OF_WEEK.find(d => d.value === day);
                          return (
                            <span
                              key={day}
                              className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
                            >
                              {dayObj?.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeSchedule(schedule.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Schedule Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsAddingSchedule(true)}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Schedule
      </Button>

      {/* Add Schedule Dialog */}
      <Dialog open={isAddingSchedule} onOpenChange={setIsAddingSchedule}>
        <DialogContent className="bg-gradient-cream max-w-md">
          <DialogHeader>
            <DialogTitle>Add Schedule</DialogTitle>
            <DialogDescription>
              Choose when you'll take this medication
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Time Presets */}
            <div className="space-y-2">
              <Label className="text-sm">Quick Select</Label>
              <div className="grid grid-cols-2 gap-2">
                {TIME_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <Button
                      key={preset.label}
                      type="button"
                      variant="outline"
                      onClick={() => setNewSchedule(prev => ({ ...prev, time: preset.time }))}
                      className={cn(
                        'justify-start',
                        newSchedule.time === preset.time && 'border-primary bg-primary/5'
                      )}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {preset.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Time Input */}
            <div className="space-y-2">
              <Label htmlFor="schedule-time" className="text-sm">Time</Label>
              <Input
                id="schedule-time"
                type="time"
                value={newSchedule.time}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, time: e.target.value }))}
                className="bg-background"
              />
            </div>

            {/* Day Selection Quick Buttons */}
            <div className="space-y-2">
              <Label className="text-sm">Quick Select Days</Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={selectAllDays}>
                  Every Day
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={selectWeekdays}>
                  Weekdays
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={selectWeekends}>
                  Weekends
                </Button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="space-y-2">
              <Label className="text-sm">Days of Week</Label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    size="sm"
                    variant={newSchedule.days.includes(day.value) ? 'default' : 'outline'}
                    onClick={() => toggleDay(day.value)}
                    className="px-2"
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Add Button */}
            <Button
              type="button"
              onClick={addSchedule}
              disabled={newSchedule.days.length === 0}
              className="w-full"
            >
              Add Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
