import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMedications } from '@/hooks/useMedications';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, Upload, Camera } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthProvider';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type FlowState = 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'CONFIRMATION' | 'SAVING';

type FrequencyOption = 'once' | 'twice' | 'three' | 'asNeeded';

interface ConfirmationForm {
  name: string;
  dosage: string;
  instructions: string;
  frequency: FrequencyOption;
  times: string[];
  days: string[];
}

interface AddMedicationFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const daysOfWeek = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' }
];

const frequencyOptions: { value: FrequencyOption; label: string; timeCount: number }[] = [
  { value: 'once', label: 'Once a Day', timeCount: 1 },
  { value: 'twice', label: 'Twice a Day', timeCount: 2 },
  { value: 'three', label: '3 Times a Day', timeCount: 3 },
  { value: 'asNeeded', label: 'As Needed', timeCount: 0 }
];

const inferFrequency = (frequencyText: string): FrequencyOption => {
  const lower = frequencyText.toLowerCase();
  if (lower.includes('bid') || lower.includes('twice')) return 'twice';
  if (lower.includes('tid') || lower.includes('three') || lower.includes('3')) return 'three';
  if (lower.includes('qid') || lower.includes('four') || lower.includes('4')) return 'three'; // Default to 3x for simplicity
  if (lower.includes('prn') || lower.includes('needed')) return 'asNeeded';
  return 'once';
};

export const AddMedicationFlow = ({ open, onOpenChange }: AddMedicationFlowProps) => {
  const [flowState, setFlowState] = useState<FlowState>('IDLE');
  const [confirmationForm, setConfirmationForm] = useState<ConfirmationForm>({
    name: '',
    dosage: '',
    instructions: '',
    frequency: 'once',
    times: ['08:00'],
    days: []
  });
  const [interactions, setInteractions] = useState<any[]>([]);
  const [showInteractionModal, setShowInteractionModal] = useState(false);

  const { addMedication, addSchedule } = useMedications();
  const { user } = useAuth();
  const { toast } = useToast();

  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    name: '',
    dosage: '',
    instructions: '',
    time: '08:00',
    days: [] as string[]
  });

  const resetAndClose = () => {
    setFlowState('IDLE');
    setConfirmationForm({
      name: '',
      dosage: '',
      instructions: '',
      frequency: 'once',
      times: ['08:00'],
      days: []
    });
    setManualForm({
      name: '',
      dosage: '',
      instructions: '',
      time: '08:00',
      days: []
    });
    setInteractions([]);
    setShowInteractionModal(false);
    onOpenChange(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload an image smaller than 10MB'
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an image file'
      });
      return;
    }

    // State: UPLOADING
    setFlowState('UPLOADING');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('prescription_uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // State: PROCESSING
      setFlowState('PROCESSING');

      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('ocr-processor', {
        body: { image_path: fileName }
      });

      if (ocrError) throw ocrError;

      // Handle specific error codes
      if (ocrData?.error_code) {
        let errorMessage = ocrData.error;
        if (ocrData.error_code === 'RATE_LIMIT') {
          errorMessage = 'Too many requests. Please try again in a moment.';
        } else if (ocrData.error_code === 'PAYMENT_REQUIRED') {
          errorMessage = 'AI quota exceeded. Please try manual entry.';
        }
        
        toast({
          variant: 'destructive',
          title: 'Scanning failed',
          description: errorMessage
        });
        setFlowState('IDLE');
        return;
      }

      // Check if medication was found
      if (ocrData?.medication && ocrData.medication.name) {
        const med = ocrData.medication;
        
        // Pre-populate confirmation form
        setConfirmationForm({
          name: med.name,
          dosage: med.dosage,
          instructions: med.instructions,
          frequency: inferFrequency(med.instructions),
          times: ['08:00'],
          days: []
        });

        // State: CONFIRMATION
        setFlowState('CONFIRMATION');
        
        toast({
          title: 'Medication detected!',
          description: 'Review and confirm the details below'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'No medication detected',
          description: 'Please ensure the label is clearly visible or try manual entry'
        });
        setFlowState('IDLE');
      }
    } catch (error: any) {
      console.error('OCR processing error:', error);
      toast({
        variant: 'destructive',
        title: 'Scanning failed',
        description: 'Please try again or enter medication details manually'
      });
      setFlowState('IDLE');
    }
  };

  const handleFrequencyChange = (frequency: FrequencyOption) => {
    const option = frequencyOptions.find(o => o.value === frequency)!;
    const newTimes = Array(option.timeCount).fill('08:00').map((_, i) => {
      if (i === 0) return '08:00';
      if (i === 1) return '20:00';
      if (i === 2) return '14:00';
      return '08:00';
    });
    
    setConfirmationForm(prev => ({
      ...prev,
      frequency,
      times: newTimes
    }));
  };

  const handleTimeChange = (index: number, value: string) => {
    setConfirmationForm(prev => ({
      ...prev,
      times: prev.times.map((t, i) => i === index ? value : t)
    }));
  };

  const toggleDay = (day: string) => {
    setConfirmationForm(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleSaveClick = async () => {
    // Validation
    if (!confirmationForm.name.trim()) {
      toast({ variant: 'destructive', title: 'Medication name is required' });
      return;
    }
    if (confirmationForm.frequency !== 'asNeeded' && confirmationForm.days.length === 0) {
      toast({ variant: 'destructive', title: 'Please select at least one day' });
      return;
    }

    // State: SAVING
    setFlowState('SAVING');

    try {
      // Step 1: Check drug interactions
      const { data: interactionData } = await supabase.functions.invoke('drug-interaction-checker', {
        body: { medication_name: confirmationForm.name }
      });

      // Step 2: Handle interaction response
      if (interactionData?.interactions && interactionData.interactions.length > 0) {
        setInteractions(interactionData.interactions);
        setShowInteractionModal(true);
        setFlowState('CONFIRMATION'); // Return to form
        return;
      }

      // Step 3: No interactions - save medication
      const medication = await addMedication.mutateAsync({
        name: confirmationForm.name,
        dosage: confirmationForm.dosage,
        instructions: confirmationForm.instructions || null,
        pill_image_url: null
      });

      // Step 4: Create schedules based on frequency
      if (confirmationForm.frequency !== 'asNeeded') {
        for (const time of confirmationForm.times) {
          await addSchedule.mutateAsync({
            medication_id: medication.id,
            time_to_take: time,
            days_of_week: confirmationForm.days
          });
        }
      }

      // Step 5: Success!
      toast({ title: 'Medication added successfully!' });
      resetAndClose();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add medication'
      });
      setFlowState('CONFIRMATION');
    }
  };

  const handleManualSubmit = async () => {
    // Validation
    if (!manualForm.name.trim()) {
      toast({ variant: 'destructive', title: 'Medication name is required' });
      return;
    }
    if (!manualForm.dosage.trim()) {
      toast({ variant: 'destructive', title: 'Dosage is required' });
      return;
    }
    if (manualForm.days.length === 0) {
      toast({ variant: 'destructive', title: 'Please select at least one day' });
      return;
    }

    setFlowState('SAVING');

    try {
      // Check interactions
      const { data: interactionData } = await supabase.functions.invoke('drug-interaction-checker', {
        body: { medication_name: manualForm.name }
      });

      if (interactionData?.interactions && interactionData.interactions.length > 0) {
        setInteractions(interactionData.interactions);
        setShowInteractionModal(true);
        setFlowState('IDLE');
        return;
      }

      // Save medication
      const medication = await addMedication.mutateAsync({
        name: manualForm.name,
        dosage: manualForm.dosage,
        instructions: manualForm.instructions || null,
        pill_image_url: null
      });

      await addSchedule.mutateAsync({
        medication_id: medication.id,
        time_to_take: manualForm.time,
        days_of_week: manualForm.days
      });

      toast({ title: 'Medication added successfully!' });
      resetAndClose();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add medication'
      });
      setFlowState('IDLE');
    }
  };

  const toggleManualDay = (day: string) => {
    setManualForm(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  // Render: Interaction Warning Modal (Blocking)
  if (showInteractionModal && interactions.length > 0) {
    return (
      <AlertDialog open={showInteractionModal} onOpenChange={setShowInteractionModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              CRITICAL SAFETY WARNING
            </AlertDialogTitle>
            <AlertDialogDescription>
              This medication may interact with your current medications:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {interactions.map((interaction, idx) => (
              <Alert key={idx} variant="destructive">
                <AlertTitle className="text-sm font-semibold">{interaction.drug}</AlertTitle>
                <AlertDescription className="text-xs">{interaction.warning}</AlertDescription>
              </Alert>
            ))}
          </div>
          <AlertDialogFooter>
            <Button
              onClick={() => {
                setShowInteractionModal(false);
                setInteractions([]);
              }}
            >
              I Understand, Go Back
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Render: CONFIRMATION State
  if (flowState === 'CONFIRMATION') {
    return (
      <Dialog open={open} onOpenChange={resetAndClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm Medication Details</DialogTitle>
            <DialogDescription>
              Review the detected information and add scheduling details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Section 1: AI-Extracted (Editable) */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Medication Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-name">Medication Name</Label>
                <Input
                  id="confirm-name"
                  value={confirmationForm.name}
                  onChange={(e) => setConfirmationForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-dosage">Dosage</Label>
                <Input
                  id="confirm-dosage"
                  value={confirmationForm.dosage}
                  onChange={(e) => setConfirmationForm(prev => ({ ...prev, dosage: e.target.value }))}
                  placeholder="e.g., 100mg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-instructions">Instructions</Label>
                <Textarea
                  id="confirm-instructions"
                  value={confirmationForm.instructions}
                  onChange={(e) => setConfirmationForm(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="e.g., Take one tablet twice daily"
                  rows={3}
                />
              </div>
            </div>

            {/* Section 2: Scheduling (Required) */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">Scheduling</h3>

              <div className="space-y-2">
                <Label>How often do you take this?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {frequencyOptions.map(option => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={confirmationForm.frequency === option.value ? 'default' : 'outline'}
                      onClick={() => handleFrequencyChange(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {confirmationForm.frequency !== 'asNeeded' && (
                <>
                  <div className="space-y-2">
                    <Label>At what time(s)?</Label>
                    {confirmationForm.times.map((time, index) => (
                      <Input
                        key={index}
                        type="time"
                        value={time}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                      />
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Which days?</Label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map(day => (
                        <Button
                          key={day.value}
                          type="button"
                          size="sm"
                          variant={confirmationForm.days.includes(day.value) ? 'default' : 'outline'}
                          onClick={() => toggleDay(day.value)}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveClick}
              disabled={flowState !== 'CONFIRMATION'}
              className="flex-1"
            >
              {flowState !== 'CONFIRMATION' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking safety...
                </>
              ) : (
                'Save Medication'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Render: IDLE, UPLOADING, PROCESSING States
  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-2xl">
        {(flowState === 'UPLOADING' || flowState === 'PROCESSING') && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">
              {flowState === 'UPLOADING' ? 'Uploading your image securely...' : 'AI is analyzing your label... this may take a moment.'}
            </p>
          </div>
        )}

        {flowState === 'IDLE' && (
          <>
            <DialogHeader>
              <DialogTitle>Add a New Medication</DialogTitle>
              <DialogDescription>
                Scan your pharmacy pill bottle label or enter details manually
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="scan" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scan">Scan Pharmacy Label</TabsTrigger>
                <TabsTrigger value="manual">Enter Manually</TabsTrigger>
              </TabsList>

              <TabsContent value="scan" className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      For best results, place your pill bottle on a flat surface in a well-lit area
                    </p>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="file-upload"
                    />
                    <Button className="w-full" size="lg">
                      <Upload className="mr-2 h-5 w-5" />
                      Scan Pharmacy Label
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Works best with printed pharmacy labels
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="manual-name">Medication Name *</Label>
                    <Input
                      id="manual-name"
                      value={manualForm.name}
                      onChange={(e) => setManualForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Lisinopril"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manual-dosage">Dosage *</Label>
                    <Input
                      id="manual-dosage"
                      value={manualForm.dosage}
                      onChange={(e) => setManualForm(prev => ({ ...prev, dosage: e.target.value }))}
                      placeholder="e.g., 20mg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manual-instructions">Instructions</Label>
                    <Textarea
                      id="manual-instructions"
                      value={manualForm.instructions}
                      onChange={(e) => setManualForm(prev => ({ ...prev, instructions: e.target.value }))}
                      placeholder="e.g., Take one tablet once daily"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manual-time">Time to Take *</Label>
                    <Input
                      id="manual-time"
                      type="time"
                      value={manualForm.time}
                      onChange={(e) => setManualForm(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Days of Week *</Label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map(day => (
                        <Button
                          key={day.value}
                          type="button"
                          size="sm"
                          variant={manualForm.days.includes(day.value) ? 'default' : 'outline'}
                          onClick={() => toggleManualDay(day.value)}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleManualSubmit}
                    disabled={flowState !== 'IDLE'}
                    className="w-full"
                  >
                    {flowState !== 'IDLE' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Medication'
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};