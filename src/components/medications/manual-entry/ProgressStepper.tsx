import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  label: string;
  description: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

export const ProgressStepper = ({ steps, currentStep, onStepClick }: ProgressStepperProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onStepClick(step.id)}
                disabled={step.id > currentStep + 1}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  step.id < currentStep && 'bg-primary text-primary-foreground',
                  step.id === currentStep && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2',
                  step.id > currentStep && 'bg-muted text-muted-foreground',
                  step.id <= currentStep && 'cursor-pointer hover:scale-105',
                  step.id > currentStep && 'cursor-not-allowed'
                )}
              >
                {step.id < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{step.id}</span>
                )}
              </button>
              
              {/* Step Label (Hidden on mobile) */}
              <div className="hidden md:flex flex-col items-center mt-2">
                <span className={cn(
                  'text-xs font-medium',
                  step.id === currentStep ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {step.description}
                </span>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={cn(
                'flex-1 h-0.5 mx-2 transition-colors',
                step.id < currentStep ? 'bg-primary' : 'bg-muted'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Mobile Step Label */}
      <div className="md:hidden text-center mt-3">
        <span className="text-sm font-medium text-foreground">
          {steps[currentStep - 1].label}
        </span>
        <span className="text-xs text-muted-foreground ml-2">
          ({steps[currentStep - 1].description})
        </span>
      </div>
    </div>
  );
};
