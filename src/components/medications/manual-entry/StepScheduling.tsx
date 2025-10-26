import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from 'lucide-react';
import { ManualEntryFormState } from '../AddMedicationManual';
import { ScheduleBuilder } from './ScheduleBuilder';
import { Input } from '@/components/ui/input';

interface StepSchedulingProps {
  formData: ManualEntryFormState;
  updateFormData: (updates: Partial<ManualEntryFormState>) => void;
}

export const StepScheduling = ({ formData, updateFormData }: StepSchedulingProps) => {
  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-cream shadow-warm border-border/50">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Scheduling</h3>
              <p className="text-xs text-muted-foreground">When should you take this medication?</p>
            </div>
          </div>

          {/* Schedule Builder */}
          <ScheduleBuilder
            schedules={formData.schedules}
            onSchedulesChange={(schedules) => updateFormData({ schedules })}
          />
        </div>
      </Card>

      {/* Duration */}
      <Card className="p-6 bg-gradient-warm-cream shadow-warm border-border/50">
        <div className="space-y-4">
          <Label className="text-sm font-medium">Duration</Label>
          <RadioGroup
            value={formData.duration}
            onValueChange={(value: 'ongoing' | 'limited') => updateFormData({ duration: value })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ongoing" id="ongoing" />
              <Label htmlFor="ongoing" className="font-normal cursor-pointer">
                Ongoing (no end date)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="limited" id="limited" />
              <Label htmlFor="limited" className="font-normal cursor-pointer">
                Limited time period
              </Label>
            </div>
          </RadioGroup>

          {formData.duration === 'limited' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateFormData({ startDate: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateFormData({ endDate: e.target.value })}
                  className="bg-background"
                />
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
