import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useMedications } from '@/hooks/useMedications';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, Upload, FileText, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthProvider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const medicationSchema = z.object({
  name: z.string().trim().min(1, 'Medication name is required').max(100, 'Name must be less than 100 characters'),
  dosage: z.string().trim().min(1, 'Dosage is required').max(50, 'Dosage must be less than 50 characters'),
  instructions: z.string().trim().max(500, 'Instructions must be less than 500 characters').optional(),
  time_to_take: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  days_of_week: z.array(z.string()).min(1, 'Select at least one day')
});

type MedicationFormData = z.infer<typeof medicationSchema>;

interface ScannedMedication {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  selected: boolean;
  isEditing: boolean;
}

interface AddMedicationFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const daysOfWeek = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' }
];

export const AddMedicationFlow = ({ open, onOpenChange }: AddMedicationFlowProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scannedMedications, setScannedMedications] = useState<ScannedMedication[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const { addMedication, addSchedule } = useMedications();
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: '',
      dosage: '',
      instructions: '',
      time_to_take: '08:00',
      days_of_week: []
    }
  });

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

    setUploadedFile(file);
    setIsProcessingOCR(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('prescription_uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('ocr-processor', {
        body: { image_path: fileName }
      });

      if (ocrError) throw ocrError;

      // Handle specific error codes from OCR processor
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
        return;
      }

      if (ocrData?.medications && ocrData.medications.length > 0) {
        const medications: ScannedMedication[] = ocrData.medications.map((med: any, idx: number) => ({
          id: `${Date.now()}-${idx}`,
          name: med.name,
          dosage: med.dosage,
          instructions: med.instructions,
          selected: true,
          isEditing: false
        }));

        setScannedMedications(medications);
        setShowReview(true);
        
        toast({
          title: `Found ${medications.length} medication${medications.length > 1 ? 's' : ''}!`,
          description: 'Review and edit before adding'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'No medications detected',
          description: 'Please try another label or enter manually'
        });
      }
    } catch (error: any) {
      console.error('OCR processing error:', error);
      toast({
        variant: 'destructive',
        title: 'Scanning failed',
        description: 'Please enter medication details manually'
      });
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const toggleMedicationSelection = (id: string) => {
    setScannedMedications(prev =>
      prev.map(med => med.id === id ? { ...med, selected: !med.selected } : med)
    );
  };

  const toggleMedicationEdit = (id: string) => {
    setScannedMedications(prev =>
      prev.map(med => med.id === id ? { ...med, isEditing: !med.isEditing } : med)
    );
  };

  const updateMedication = (id: string, field: keyof ScannedMedication, value: string) => {
    setScannedMedications(prev =>
      prev.map(med => med.id === id ? { ...med, [field]: value } : med)
    );
  };

  const removeMedication = (id: string) => {
    setScannedMedications(prev => prev.filter(med => med.id !== id));
  };

  const handleAddSelectedMedications = async () => {
    const selected = scannedMedications.filter(med => med.selected);
    
    if (selected.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No medications selected',
        description: 'Please select at least one medication'
      });
      return;
    }

    if (scheduleDays.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No days selected',
        description: 'Please select at least one day'
      });
      return;
    }

    setIsChecking(true);

    try {
      // Check interactions for all selected medications
      const allInteractions: any[] = [];
      for (const med of selected) {
        const { data: interactionData } = await supabase.functions.invoke('drug-interaction-checker', {
          body: { medication_name: med.name }
        });

        if (interactionData?.interactions && interactionData.interactions.length > 0) {
          allInteractions.push(...interactionData.interactions);
        }
      }

      if (allInteractions.length > 0) {
        setInteractions(allInteractions);
        setIsChecking(false);
        return;
      }

      // Add all medications
      for (const med of selected) {
        const medication = await addMedication.mutateAsync({
          name: med.name,
          dosage: med.dosage,
          instructions: med.instructions || null,
          pill_image_url: null
        });

        await addSchedule.mutateAsync({
          medication_id: medication.id,
          time_to_take: scheduleTime,
          days_of_week: scheduleDays
        });
      }

      toast({
        title: `${selected.length} medication${selected.length > 1 ? 's' : ''} added`,
        description: 'Your medications have been added successfully'
      });

      resetFlow();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add medications'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const resetFlow = () => {
    setScannedMedications([]);
    setShowReview(false);
    setUploadedFile(null);
    setScheduleTime('08:00');
    setScheduleDays([]);
    setInteractions([]);
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: MedicationFormData) => {
    try {
      setIsChecking(true);
      
      const { data: interactionData, error: interactionError } = await supabase.functions.invoke('drug-interaction-checker', {
        body: { medication_name: data.name }
      });

      if (interactionError) {
        console.error('Interaction check failed:', interactionError);
      } else if (interactionData?.interactions && interactionData.interactions.length > 0) {
        setInteractions(interactionData.interactions);
        setIsChecking(false);
        return;
      }

      const medication = await addMedication.mutateAsync({
        name: data.name,
        dosage: data.dosage,
        instructions: data.instructions || null,
        pill_image_url: null
      });

      await addSchedule.mutateAsync({
        medication_id: medication.id,
        time_to_take: data.time_to_take,
        days_of_week: data.days_of_week
      });

      toast({
        title: 'Medication added',
        description: 'Your medication has been added successfully'
      });

      resetFlow();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add medication'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleConfirmWithInteractions = async () => {
    const selected = scannedMedications.filter(med => med.selected);
    
    try {
      if (selected.length > 0) {
        // Batch add from scan
        for (const med of selected) {
          const medication = await addMedication.mutateAsync({
            name: med.name,
            dosage: med.dosage,
            instructions: med.instructions || null,
            pill_image_url: null
          });

          await addSchedule.mutateAsync({
            medication_id: medication.id,
            time_to_take: scheduleTime,
            days_of_week: scheduleDays
          });
        }

        toast({
          title: `${selected.length} medication${selected.length > 1 ? 's' : ''} added`,
          description: 'Please consult your doctor about the warnings.'
        });
      } else {
        // Single manual add
        const data = form.getValues();
        const medication = await addMedication.mutateAsync({
          name: data.name,
          dosage: data.dosage,
          instructions: data.instructions || null,
          pill_image_url: null
        });

        await addSchedule.mutateAsync({
          medication_id: medication.id,
          time_to_take: data.time_to_take,
          days_of_week: data.days_of_week
        });

        toast({
          title: 'Medication added',
          description: 'Please consult your doctor about the warnings.'
        });
      }

      resetFlow();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to add medication'
      });
    }
  };

  if (interactions.length > 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Drug Interaction Warnings
            </DialogTitle>
            <DialogDescription>
              Potential interactions have been detected with your current medications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {interactions.map((interaction, idx) => (
              <Alert key={idx} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{interaction.drug}</AlertTitle>
                <AlertDescription>{interaction.warning}</AlertDescription>
              </Alert>
            ))}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setInteractions([])}>
                Go Back
              </Button>
              <Button variant="destructive" onClick={handleConfirmWithInteractions}>
                Add Anyway (Consult Doctor)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (showReview && scannedMedications.length > 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Detected Medications</DialogTitle>
            <DialogDescription>
              {scannedMedications.filter(m => m.selected).length} of {scannedMedications.length} selected
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Instructions</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scannedMedications.map((med) => (
                    <TableRow key={med.id}>
                      <TableCell>
                        <Checkbox
                          checked={med.selected}
                          onCheckedChange={() => toggleMedicationSelection(med.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {med.isEditing ? (
                          <Input
                            value={med.name}
                            onChange={(e) => updateMedication(med.id, 'name', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium">{med.name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {med.isEditing ? (
                          <Input
                            value={med.dosage}
                            onChange={(e) => updateMedication(med.id, 'dosage', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          med.dosage
                        )}
                      </TableCell>
                      <TableCell>
                        {med.isEditing ? (
                          <Input
                            value={med.instructions}
                            onChange={(e) => updateMedication(med.id, 'instructions', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">{med.instructions}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => toggleMedicationEdit(med.id)}
                          >
                            {med.isEditing ? <CheckCircle2 className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => removeMedication(med.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <Label>Time to Take (for all selected)</Label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Days of Week (for all selected)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {daysOfWeek.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        checked={scheduleDays.includes(day.value)}
                        onCheckedChange={(checked) => {
                          setScheduleDays(prev =>
                            checked
                              ? [...prev, day.value]
                              : prev.filter(d => d !== day.value)
                          );
                        }}
                      />
                      <Label className="font-normal cursor-pointer text-sm">{day.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowReview(false)}>
                Back to Upload
              </Button>
              <Button onClick={handleAddSelectedMedications} disabled={isChecking}>
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  `Add ${scannedMedications.filter(m => m.selected).length} Selected`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Medication</DialogTitle>
          <DialogDescription>
            Scan a pharmacy pill bottle label or enter details manually
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan">
              <Upload className="mr-2 h-4 w-4" />
              Scan Pharmacy Label
            </TabsTrigger>
            <TabsTrigger value="manual">
              <FileText className="mr-2 h-4 w-4" />
              Enter Manually
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <Label htmlFor="prescription-upload" className="cursor-pointer">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Upload pharmacy pill bottle label</p>
                  <p className="text-xs text-muted-foreground">
                    Works best with printed pharmacy labels
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 10MB • Supports multiple medications
                  </p>
                </div>
                <Input
                  id="prescription-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isProcessingOCR}
                />
                <Button type="button" className="mt-4" disabled={isProcessingOCR}>
                  {isProcessingOCR ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Choose File'
                  )}
                </Button>
              </Label>
              {uploadedFile && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Uploaded: {uploadedFile.name}
                </p>
              )}
            </div>
            {isProcessingOCR && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Processing label...</AlertTitle>
                <AlertDescription>
                  AI is extracting medication details from your pharmacy label
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="manual">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medication Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Lisinopril" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dosage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosage</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 10mg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., Take one tablet by mouth daily with food"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time_to_take"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time to Take</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="days_of_week"
                  render={() => (
                    <FormItem>
                      <FormLabel>Days of Week</FormLabel>
                      <div className="grid grid-cols-2 gap-3">
                        {daysOfWeek.map((day) => (
                          <FormField
                            key={day.value}
                            control={form.control}
                            name="days_of_week"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(day.value)}
                                    onCheckedChange={(checked) => {
                                      const updatedValue = checked
                                        ? [...(field.value || []), day.value]
                                        : field.value?.filter((v) => v !== day.value) || [];
                                      field.onChange(updatedValue);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {day.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isChecking || addMedication.isPending}>
                    {isChecking || addMedication.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isChecking ? 'Checking interactions...' : 'Adding...'}
                      </>
                    ) : (
                      'Add Medication'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};