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
import { Textarea } from '@/components/ui/textarea';
import { Medication, Schedule } from '@/hooks/useMedications';
import { Loader2 } from 'lucide-react';

interface EditMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication: Medication;
  schedules: Schedule[];
  onSave: (
    medicationId: string,
    updates: Partial<Medication>,
    schedules: Schedule[]
  ) => Promise<void>;
}

export const EditMedicationDialog = ({
  open,
  onOpenChange,
  medication,
  schedules,
  onSave,
}: EditMedicationDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: medication.name,
    dosage: medication.dosage,
    instructions: medication.instructions || '',
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(
        medication.id,
        {
          name: formData.name,
          dosage: formData.dosage,
          instructions: formData.instructions,
        },
        schedules
      );
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save medication:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Medication</DialogTitle>
          <DialogDescription>
            Update the details of your medication. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Medication Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Lisinopril"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-dosage">Dosage</Label>
            <Input
              id="edit-dosage"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              placeholder="e.g., 10mg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-instructions">Instructions (Optional)</Label>
            <Textarea
              id="edit-instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="e.g., Take with food"
              rows={3}
            />
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
