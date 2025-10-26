import { useState } from 'react';
import { StepBasicDetails } from './manual-entry/StepBasicDetails';
import { StepScheduling } from './manual-entry/StepScheduling';
import { StepInstructions } from './manual-entry/StepInstructions';
import { StepPrescriptionInfo } from './manual-entry/StepPrescriptionInfo';
import { StepReviewConfirm } from './manual-entry/StepReviewConfirm';
import { ProgressStepper } from './manual-entry/ProgressStepper';
import { MedicationPreviewCard } from './manual-entry/MedicationPreviewCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export interface ManualEntryFormState {
  // Step 1: Basics
  name: string;
  dosage: string;
  dosageUnit: string;
  formType: string;
  medicationType: string;
  genericName: string;
  brandName: string;
  pillImageUrl: string;
  
  // Step 2: Scheduling
  schedules: Array<{
    id: string;
    label: string;
    time: string;
    days: string[];
  }>;
  duration: 'ongoing' | 'limited';
  startDate: string;
  endDate: string;
  
  // Step 3: Instructions
  instructions: string;
  notes: string;
  quickTags: string[];
  
  // Step 4: Prescription
  doctorName: string;
  doctorPhone: string;
  pharmacyName: string;
  pharmacyPhone: string;
  prescriptionNumber: string;
  refillQuantity: string;
  currentQuantity: string;
  lastRefillDate: string;
  refillsRemaining: string;
  expirationDate: string;
  costPerRefill: string;
}

interface AddMedicationManualProps {
  onComplete: (formData: ManualEntryFormState) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, label: 'Details', description: 'Medication basics' },
  { id: 2, label: 'Schedule', description: 'When to take' },
  { id: 3, label: 'Instructions', description: 'How to take' },
  { id: 4, label: 'Prescription', description: 'Optional info' },
  { id: 5, label: 'Review', description: 'Confirm & save' }
];

export const AddMedicationManual = ({ onComplete, onCancel }: AddMedicationManualProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ManualEntryFormState>({
    name: '',
    dosage: '',
    dosageUnit: 'mg',
    formType: 'Tablet',
    medicationType: 'Prescription',
    genericName: '',
    brandName: '',
    pillImageUrl: '',
    schedules: [],
    duration: 'ongoing',
    startDate: '',
    endDate: '',
    instructions: '',
    notes: '',
    quickTags: [],
    doctorName: '',
    doctorPhone: '',
    pharmacyName: '',
    pharmacyPhone: '',
    prescriptionNumber: '',
    refillQuantity: '',
    currentQuantity: '',
    lastRefillDate: '',
    refillsRemaining: '',
    expirationDate: '',
    costPerRefill: ''
  });

  const updateFormData = (updates: Partial<ManualEntryFormState>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== '' && formData.dosage.trim() !== '';
      case 2:
        return formData.schedules.length > 0;
      case 3:
        return true; // Optional step
      case 4:
        return true; // Optional step
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep || (step === currentStep + 1 && canProceed())) {
      setCurrentStep(step);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepBasicDetails formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <StepScheduling formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <StepInstructions formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <StepPrescriptionInfo formData={formData} updateFormData={updateFormData} />;
      case 5:
        return <StepReviewConfirm formData={formData} onComplete={onComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ProgressStepper
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Form - Left Side (2/3 width on desktop) */}
        <div className="lg:col-span-2">
          {renderStep()}
        </div>

        {/* Preview Card - Right Side (1/3 width on desktop, hidden on mobile) */}
        <div className="lg:col-span-1 hidden lg:block">
          <MedicationPreviewCard formData={formData} />
        </div>
      </div>

      {/* Navigation Buttons - Sticky on mobile */}
      {currentStep < 5 && (
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border sticky bottom-0 bg-background/95 backdrop-blur -mx-6 px-6 py-4 md:static md:mx-0 md:px-0 md:py-0">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? onCancel : handleBack}
            className="flex-1 sm:flex-initial h-11 md:h-10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>

          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 sm:flex-initial h-11 md:h-10"
          >
            {currentStep === 4 ? 'Review' : 'Next'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
