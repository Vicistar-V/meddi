import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Camera, Edit3 } from 'lucide-react';
import { AddMedicationManual, ManualEntryFormState } from '@/components/medications/AddMedicationManual';
import { CameraView } from '@/components/CameraView';
import { useToast } from '@/hooks/use-toast';
import { useMedications } from '@/hooks/useMedications';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function AddMedication() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: userProfile } = useUserProfile();
  const { addMedication, addSchedule } = useMedications();
  
  // Redirect caregivers to medications page (read-only access)
  if (userProfile?.isCaregiver) {
    return <Navigate to="/medications" replace />;
  }
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track if user has started entering data
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true);
    } else {
      navigate('/medications');
    }
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    navigate('/medications');
  };

  const handleComplete = async (formData: ManualEntryFormState) => {
    setIsSaving(true);
    
    try {
      // Check for drug interactions
      const { data: interactionData } = await supabase.functions.invoke('drug-interaction-checker', {
        body: { medication_name: formData.name }
      });

      if (interactionData?.interactions && interactionData.interactions.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Drug Interaction Warning',
          description: `This medication may interact with ${interactionData.interactions.length} of your current medications. Please consult your doctor.`,
        });
        // Continue with save but show warning
      }

      // Save medication
      const medication = await addMedication.mutateAsync({
        name: formData.name,
        dosage: `${formData.dosage}${formData.dosageUnit}`,
        instructions: formData.instructions || null,
        pill_image_url: null,
      });

      // Save all schedules
      for (const schedule of formData.schedules) {
        await addSchedule.mutateAsync({
          medication_id: medication.id,
          time_to_take: schedule.time,
          days_of_week: schedule.days,
        });
      }

      toast({
        title: 'Success!',
        description: 'Medication added successfully.',
      });

      setHasUnsavedChanges(false);
      navigate('/medications');
    } catch (error: any) {
      console.error('Error saving medication:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save medication. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    handleBack();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Medications</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <h1 className="ml-4 text-lg font-semibold">Add New Medication</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 pb-24 sm:pb-6">
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'scan' | 'manual')} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="scan" className="gap-2">
              <Camera className="h-4 w-4" />
              Scan Prescription
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Edit3 className="h-4 w-4" />
              Enter Manually
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="mt-6">
            <div className="max-w-3xl mx-auto">
              <CameraView />
            </div>
          </TabsContent>

          <TabsContent value="manual" className="mt-6">
            <AddMedicationManual
              onComplete={handleComplete}
              onCancel={handleCancel}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? All entered data will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
