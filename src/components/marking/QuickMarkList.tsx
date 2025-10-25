import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, Pill } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Medication {
  id: string;
  name: string;
  dosage: string;
}

interface Schedule {
  id: string;
}

interface MedicationItem {
  medication: Medication;
  schedule: Schedule;
}

interface QuickMarkListProps {
  items: MedicationItem[];
  onMarkAll: () => void;
  onMarkSingle: (scheduleId: string) => void;
  isMarking: boolean;
}

export const QuickMarkList = ({
  items,
  onMarkAll,
  onMarkSingle,
  isMarking,
}: QuickMarkListProps) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const handleCheck = (scheduleId: string) => {
    const newSet = new Set(checkedItems);
    if (newSet.has(scheduleId)) {
      newSet.delete(scheduleId);
    } else {
      newSet.add(scheduleId);
      onMarkSingle(scheduleId);
    }
    setCheckedItems(newSet);
  };

  const completedCount = checkedItems.size;
  const totalCount = items.length;

  const pillColors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500',
  ];

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span className="text-muted-foreground">
            {completedCount} of {totalCount}
          </span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Medication list */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {items.map((item, index) => {
            const isChecked = checkedItems.has(item.schedule.id);
            const colorClass = pillColors[index % pillColors.length];

            return (
              <div
                key={item.schedule.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-all',
                  isChecked && 'border-green-500 bg-green-50 dark:bg-green-950/20'
                )}
              >
                {/* Checkbox */}
                <Checkbox
                  id={item.schedule.id}
                  checked={isChecked}
                  onCheckedChange={() => handleCheck(item.schedule.id)}
                  disabled={isMarking}
                  className={cn(
                    'h-6 w-6',
                    isChecked && 'animate-scale-in'
                  )}
                />

                {/* Pill icon */}
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full',
                    colorClass,
                    'text-white'
                  )}
                >
                  <Pill className="h-6 w-6" />
                </div>

                {/* Medication info */}
                <div className="flex-1">
                  <h4 className="font-semibold">{item.medication.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {item.medication.dosage}
                  </p>
                </div>

                {/* Check indicator */}
                {isChecked && (
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 animate-scale-in" />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Mark all button */}
      <Button
        onClick={onMarkAll}
        disabled={isMarking || completedCount === totalCount}
        size="lg"
        className="w-full"
      >
        {isMarking ? (
          'Logging...'
        ) : completedCount === totalCount ? (
          <>
            <Check className="mr-2 h-5 w-5" />
            All Marked!
          </>
        ) : (
          <>
            <Check className="mr-2 h-5 w-5" />
            Mark All as Taken ({totalCount - completedCount} remaining)
          </>
        )}
      </Button>
    </div>
  );
};
