import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText } from 'lucide-react';
import { ManualEntryFormState } from '../AddMedicationManual';

interface StepInstructionsProps {
  formData: ManualEntryFormState;
  updateFormData: (updates: Partial<ManualEntryFormState>) => void;
}

const QUICK_TAGS = [
  'Take with food',
  'Take on empty stomach',
  'Take with water',
  'Avoid alcohol',
  'May cause drowsiness',
  'Take before bedtime',
  'Avoid driving',
  'Avoid direct sunlight'
];

export const StepInstructions = ({ formData, updateFormData }: StepInstructionsProps) => {
  const toggleTag = (tag: string) => {
    const tags = formData.quickTags.includes(tag)
      ? formData.quickTags.filter(t => t !== tag)
      : [...formData.quickTags, tag];
    
    updateFormData({ quickTags: tags });

    // Auto-populate instructions based on tags
    if (!formData.instructions.includes(tag) && !formData.quickTags.includes(tag)) {
      const newInstructions = formData.instructions 
        ? `${formData.instructions}\n${tag}`
        : tag;
      updateFormData({ instructions: newInstructions });
    }
  };

  return (
    <Card className="p-6 bg-gradient-cream shadow-warm border-border/50">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Instructions & Notes</h3>
            <p className="text-xs text-muted-foreground">How should this medication be taken?</p>
          </div>
        </div>

        {/* Quick Tags */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Quick Tags <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {QUICK_TAGS.map((tag) => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox
                  id={tag}
                  checked={formData.quickTags.includes(tag)}
                  onCheckedChange={() => toggleTag(tag)}
                />
                <Label htmlFor={tag} className="text-sm font-normal cursor-pointer">
                  {tag}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <Label htmlFor="instructions" className="text-sm font-medium">
            Instructions <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Textarea
            id="instructions"
            value={formData.instructions}
            onChange={(e) => updateFormData({ instructions: e.target.value })}
            placeholder="e.g., Take one tablet with food in the morning..."
            rows={4}
            className="bg-background resize-none"
          />
          <p className="text-xs text-muted-foreground">
            How should this medication be taken? Any special instructions?
          </p>
        </div>

        {/* Important Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            Important Notes <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => updateFormData({ notes: e.target.value })}
            placeholder="e.g., May cause dizziness. Store in cool, dry place..."
            rows={4}
            className="bg-background resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Side effects to watch for, storage instructions, or other important information
          </p>
        </div>
      </div>
    </Card>
  );
};
