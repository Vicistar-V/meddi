import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';

interface Medication {
  schedule: any;
  medication: any;
  wasTaken: boolean;
}

interface DayDetailSheetProps {
  date: Date | null;
  medications: Medication[];
  onClose: () => void;
}

export const DayDetailSheet = ({ date, medications, onClose }: DayDetailSheetProps) => {
  if (!date) return null;

  const takenCount = medications.filter(m => m.wasTaken).length;
  const totalCount = medications.length;
  const adherence = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  return (
    <Sheet open={!!date} onOpenChange={() => onClose()}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {format(date, 'EEEE, MMMM d, yyyy')}
          </SheetTitle>
          <SheetDescription>
            {totalCount > 0 ? (
              <span>
                {takenCount} of {totalCount} doses taken ({adherence}%)
              </span>
            ) : (
              <span>No medications scheduled</span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {medications.length > 0 ? (
            medications.map(({ schedule, medication, wasTaken }) => (
              <div
                key={schedule.id}
                className="animate-fade-in flex items-center justify-between rounded-lg border bg-background p-4 shadow-vanilla"
              >
                <div className="flex-1">
                  <p className="font-semibold">{medication.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{medication.dosage}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{schedule.time_to_take}</span>
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={wasTaken ? 'default' : 'secondary'}
                  className={wasTaken ? 'bg-success text-success-foreground' : ''}
                >
                  {wasTaken ? 'Taken' : 'Scheduled'}
                </Badge>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                No medications scheduled for this day
              </p>
            </div>
          )}
        </div>

        {totalCount > 0 && (
          <div className="mt-6 rounded-lg bg-muted/50 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Daily Progress</span>
              <span className="font-semibold">{adherence}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-background">
              <div
                className={`h-full transition-all ${
                  adherence === 100 ? 'bg-success' :
                  adherence >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${adherence}%` }}
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
