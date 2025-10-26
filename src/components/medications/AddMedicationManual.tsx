import { useState } from 'react';
import { StepBasicDetails } from './manual-entry/StepBasicDetails';
import { StepScheduling } from './manual-entry/StepScheduling';
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
  
  // Step 3: Review & Instructions
  instructions: string;
}

interface AddMedicationManualProps {
  onComplete: (formData: ManualEntryFormState) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, label: 'Details', description: 'Name & dosage' },
  { id: 2, label: 'Schedule', description: 'When to take' },
  { id: 3, label: 'Review', description: 'Confirm & save' }
];

export const AddMedicationManual = ({ onComplete, onCancel }: AddMedicationManualProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ManualEntryFormState>({
    name: '',
    dosage: '',
    dosageUnit: 'mg',
    schedules: [],
    duration: 'ongoing',
    startDate: '',
    endDate: '',
    instructions: ''
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
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 3) {
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
        return <StepReviewConfirm formData={formData} updateFormData={updateFormData} onComplete={onComplete} />;
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form - Left Side (2/3 width on desktop) */}
        <div className="lg:col-span-2">
          {renderStep()}
        </div>

        {/* Preview Card - Right Side (1/3 width on desktop) */}
        <div className="lg:col-span-1 hidden lg:block">
          <MedicationPreviewCard formData={formData} />
        </div>
      </div>

      {/* Navigation Buttons */}
      {currentStep < 3 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 ? onCancel : handleBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>

          <Button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {currentStep === 2 ? 'Review' : 'Next'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
