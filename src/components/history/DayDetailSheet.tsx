import { format } from 'date-fns';
import { Check, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { DayData } from '@/hooks/useSimpleHistory';

interface DayDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dayData: DayData | null;
}

export const DayDetailSheet = ({
  isOpen,
  onClose,
  dayData,
}: DayDetailSheetProps) => {
  if (!dayData) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{format(dayData.date, 'EEEE, MMMM d, yyyy')}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {dayData.adherence === 'no-schedule' ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No medications scheduled for this day</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Adherence</span>
                <span className="font-semibold">
                  {dayData.taken} of {dayData.total} doses
                </span>
              </div>

              <div className="space-y-3">
                {dayData.medications.map((med, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border"
                  >
                    <div className="mt-0.5">
                      {med.taken ? (
                        <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center">
                          <X className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-medium">{med.name}</p>
                      <p className="text-sm text-muted-foreground">{med.dosage}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Scheduled: {format(new Date(`2000-01-01T${med.time}`), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
