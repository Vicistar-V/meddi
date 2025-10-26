import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pill } from 'lucide-react';
import { ManualEntryFormState } from '../AddMedicationManual';
import { DosageInput } from './DosageInput';

interface StepBasicDetailsProps {
  formData: ManualEntryFormState;
  updateFormData: (updates: Partial<ManualEntryFormState>) => void;
}

export const StepBasicDetails = ({ formData, updateFormData }: StepBasicDetailsProps) => {
  return (
    <Card className="p-6 bg-gradient-cream shadow-warm border-border/50">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Pill className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Medication Details</h3>
            <p className="text-xs text-muted-foreground">Enter the medication name and dosage</p>
          </div>
        </div>

        {/* Medication Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Medication Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="e.g., Lisinopril"
            className="bg-background"
          />
        </div>

        {/* Dosage */}
        <DosageInput
          dosage={formData.dosage}
          dosageUnit={formData.dosageUnit}
          onDosageChange={(dosage) => updateFormData({ dosage })}
          onUnitChange={(dosageUnit) => updateFormData({ dosageUnit })}
        />
      </div>
    </Card>
  );
};
