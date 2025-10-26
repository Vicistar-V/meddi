import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pill } from 'lucide-react';
import { ManualEntryFormState } from '../AddMedicationManual';
import { DosageInput } from './DosageInput';

interface StepBasicDetailsProps {
  formData: ManualEntryFormState;
  updateFormData: (updates: Partial<ManualEntryFormState>) => void;
}

const FORM_TYPES = ['Tablet', 'Capsule', 'Liquid', 'Injection', 'Topical', 'Inhaler', 'Drops', 'Patch', 'Suppository'];
const MEDICATION_TYPES = ['Prescription', 'OTC', 'Vitamin', 'Supplement', 'Herbal'];

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
            <p className="text-xs text-muted-foreground">Basic information about the medication</p>
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

        {/* Form Type & Medication Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="formType" className="text-sm font-medium">
              Form Type
            </Label>
            <Select value={formData.formType} onValueChange={(value) => updateFormData({ formType: value })}>
              <SelectTrigger id="formType" className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicationType" className="text-sm font-medium">
              Type
            </Label>
            <Select value={formData.medicationType} onValueChange={(value) => updateFormData({ medicationType: value })}>
              <SelectTrigger id="medicationType" className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDICATION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generic & Brand Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="genericName" className="text-sm font-medium">
              Generic Name <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="genericName"
              value={formData.genericName}
              onChange={(e) => updateFormData({ genericName: e.target.value })}
              placeholder="e.g., Acetaminophen"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandName" className="text-sm font-medium">
              Brand Name <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="brandName"
              value={formData.brandName}
              onChange={(e) => updateFormData({ brandName: e.target.value })}
              placeholder="e.g., Tylenol"
              className="bg-background"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
