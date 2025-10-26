import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Interaction {
  drug: string;
  severity: 'severe' | 'moderate' | 'minor';
  warning: string;
  recommendation?: string;
}

interface InteractionWarningBannerProps {
  medicationId: string;
  medicationName: string;
  interactions: Interaction[];
  onViewDetails: () => void;
  onDismiss?: () => void;
}

export const InteractionWarningBanner = ({
  medicationId,
  medicationName,
  interactions,
  onViewDetails,
  onDismiss,
}: InteractionWarningBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || interactions.length === 0) return null;

  const severityColors = {
    severe: 'border-red-500 bg-red-50 dark:bg-red-950/20',
    moderate: 'border-orange-500 bg-orange-50 dark:bg-orange-950/20',
    minor: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
  };

  const highestSeverity = interactions.some(i => i.severity === 'severe') 
    ? 'severe' 
    : interactions.some(i => i.severity === 'moderate') 
    ? 'moderate' 
    : 'minor';

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
      // Store in localStorage
      localStorage.setItem(`dismissed-interaction-${medicationId}`, 'true');
    }
  };

  return (
    <Alert className={cn('mb-3 relative', severityColors[highestSeverity])}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between pr-6">
        <span>Drug Interaction Warning</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 absolute right-2 top-2"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p className="text-sm">
          <strong>{medicationName}</strong> may interact with{' '}
          <strong>{interactions.length}</strong> of your current medication{interactions.length > 1 ? 's' : ''}.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onViewDetails}
          className="mt-2"
        >
          View Details
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};
