import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { ManualEntryFormState } from '../AddMedicationManual';
import { useMedications } from '@/hooks/useMedications';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface StepReviewConfirmProps {
  formData: ManualEntryFormState;
  updateFormData: (updates: Partial<ManualEntryFormState>) => void;
  onComplete: (formData: ManualEntryFormState) => void;
}

const DAYS_MAP: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun'
};

export const StepReviewConfirm = ({ formData, updateFormData, onComplete }: StepReviewConfirmProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [showInteractions, setShowInteractions] = useState(false);
  
  const { addMedication, addSchedule } = useMedications();
  const { toast } = useToast();

  const handleCheckInteractions = async () => {
    setIsChecking(true);
    setShowInteractions(false);
    
    try {
      const { data } = await supabase.functions.invoke('drug-interaction-checker', {
        body: { medication_name: formData.name }
      });

      if (data?.interactions && data.interactions.length > 0) {
        setInteractions(data.interactions);
        setShowInteractions(true);
      } else {
        toast({
          title: 'No interactions found',
          description: 'This medication appears safe to add.'
        });
      }
    } catch (error) {
      console.error('Interaction check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Check interactions one more time
      const { data: interactionData } = await supabase.functions.invoke('drug-interaction-checker', {
        body: { medication_name: formData.name }
      });

      if (interactionData?.interactions && interactionData.interactions.length > 0) {
        setInteractions(interactionData.interactions);
        setShowInteractions(true);
        setIsSaving(false);
        return;
      }

      // Save medication
      const medication = await addMedication.mutateAsync({
        name: formData.name,
        dosage: `${formData.dosage}${formData.dosageUnit}`,
        instructions: formData.instructions || null,
        pill_image_url: null
      });

      // Save schedules
      for (const schedule of formData.schedules) {
        await addSchedule.mutateAsync({
          medication_id: medication.id,
          time_to_take: schedule.time,
          days_of_week: schedule.days
        });
      }

      toast({ title: 'Medication added successfully!' });
      onComplete(formData);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add medication'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Interaction Warning */}
      {showInteractions && interactions.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Drug Interaction Warning</AlertTitle>
          <AlertDescription>
            This medication may interact with {interactions.length} of your current medications.
            Review the interactions before saving.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Review Card */}
      <Card className="p-6 bg-gradient-cream shadow-warm border-border/50">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Review & Confirm</h3>
              <p className="text-xs text-muted-foreground">Please review all details before saving</p>
            </div>
          </div>

          {/* Medication Details */}
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-foreground">{formData.name}</h4>
              <p className="text-sm text-muted-foreground">
                {formData.dosage}{formData.dosageUnit}
              </p>
            </div>
          </div>

          <Separator />

          {/* Schedules */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Schedules ({formData.schedules.length})
              </span>
            </div>
            <div className="space-y-2">
              {formData.schedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">
                      {new Date(`2000-01-01T${schedule.time}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">
                      {schedule.days.map(d => DAYS_MAP[d]).join(', ')}
                    </span>
                  </div>
                  <Badge variant="outline">{schedule.label}</Badge>
                </div>
              ))}
            </div>
            {formData.duration === 'limited' && (
              <p className="text-xs text-muted-foreground">
                <Calendar className="inline h-3 w-3 mr-1" />
                Duration: {formData.startDate} to {formData.endDate}
              </p>
            )}
          </div>

          <Separator />
          
          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions" className="text-sm font-medium">
              Special Instructions <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => updateFormData({ instructions: e.target.value })}
              placeholder="e.g., Take with food, avoid dairy, etc."
              className="bg-background min-h-[80px]"
            />
          </div>
        </div>
      </Card>

      {/* Interaction Details */}
      {showInteractions && interactions.length > 0 && (
        <Card className="p-6 bg-destructive/5 border-destructive">
          <div className="space-y-3">
            <h4 className="font-semibold text-destructive">Detected Interactions:</h4>
            {interactions.map((interaction, idx) => (
              <Alert key={idx} variant="destructive">
                <AlertTitle className="text-sm font-semibold">{interaction.drug}</AlertTitle>
                <AlertDescription className="text-xs">{interaction.warning}</AlertDescription>
                {interaction.recommendation && (
                  <p className="text-xs mt-1 font-medium">→ {interaction.recommendation}</p>
                )}
              </Alert>
            ))}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleCheckInteractions}
          disabled={isChecking || isSaving}
          className="flex-1"
        >
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            'Check Drug Interactions'
          )}
        </Button>
        
        <Button
          type="button"
          onClick={handleSave}
          disabled={isChecking || isSaving}
          className="flex-1"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Medication'
          )}
        </Button>
      </div>

      {showInteractions && interactions.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          ⚠️ Please review the interactions above. By saving, you acknowledge these warnings.
        </p>
      )}
    </div>
  );
};
