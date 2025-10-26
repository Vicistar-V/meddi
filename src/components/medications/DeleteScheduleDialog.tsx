import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Schedule } from '@/hooks/useMedications';
import { AlertTriangle } from 'lucide-react';

interface DeleteScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule | null;
  isOnlySchedule?: boolean;
  onConfirm: () => void;
}

export const DeleteScheduleDialog = ({
  open,
  onOpenChange,
  schedule,
  isOnlySchedule = false,
  onConfirm,
}: DeleteScheduleDialogProps) => {
  if (!schedule) return null;

  const scheduleDays = (schedule.days_of_week as string[]).join(', ');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Schedule?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>This will permanently delete:</p>
              <div className="bg-muted rounded-md p-3 text-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{schedule.time_to_take}</span>
                  <span className="text-muted-foreground">on {scheduleDays}</span>
                </div>
              </div>
              
              {isOnlySchedule && (
                <div className="flex gap-2 items-start bg-orange-50 dark:bg-orange-950/20 p-3 rounded-md border border-orange-200 dark:border-orange-900">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-orange-900 dark:text-orange-100">
                    <strong>Warning:</strong> This is the only schedule for this medication. 
                    You won't receive any reminders after deletion.
                  </div>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. The medication itself will not be deleted.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Schedule
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
