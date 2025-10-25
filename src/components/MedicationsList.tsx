import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMedications } from "@/hooks/useMedications";
import { Trash2, Pill } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export const MedicationsList = () => {
  const { medications, schedules, isLoading, deleteMedication } = useMedications();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteMedication.mutateAsync(deleteId);
      toast.success("Medication deleted successfully");
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting medication:', error);
      toast.error("Failed to delete medication");
    }
  };

  const getMedicationSchedules = (medicationId: string) => {
    return schedules.filter(s => s.medication_id === medicationId);
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading medications...</div>;
  }

  if (medications.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Pill className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No medications added yet</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {medications.map((med) => {
          const medSchedules = getMedicationSchedules(med.id);
          return (
            <Card key={med.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{med.name}</h3>
                  <p className="text-sm text-muted-foreground">{med.dosage}</p>
                  {med.instructions && (
                    <p className="text-sm text-muted-foreground mt-1">{med.instructions}</p>
                  )}
                  {medSchedules.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {medSchedules.length} schedule{medSchedules.length !== 1 ? 's' : ''} configured
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(med.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medication</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this medication? This will also remove all associated schedules. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
