import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ExternalLink, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Interaction {
  drug: string;
  severity: 'severe' | 'moderate' | 'minor';
  warning: string;
  recommendation?: string;
}

interface InteractionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicationName: string;
  interactions: Interaction[];
}

export const InteractionDetailsDialog = ({
  open,
  onOpenChange,
  medicationName,
  interactions,
}: InteractionDetailsDialogProps) => {
  const getSeverityVariant = (severity: string): "default" | "secondary" | "destructive" => {
    switch (severity) {
      case 'severe':
        return 'destructive';
      case 'moderate':
        return 'secondary';
      case 'minor':
      default:
        return 'default';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'border-red-500';
      case 'moderate':
        return 'border-orange-500';
      case 'minor':
        return 'border-yellow-500';
      default:
        return 'border-border';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Drug Interactions: {medicationName}
          </DialogTitle>
          <DialogDescription>
            Review potential interactions with your current medications
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {interactions.map((interaction, index) => (
              <div
                key={index}
                className={`border-l-4 ${getSeverityColor(interaction.severity)} bg-card rounded-md p-4 space-y-2`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityVariant(interaction.severity)} className="uppercase text-xs">
                        {interaction.severity}
                      </Badge>
                      <span className="font-semibold text-foreground">
                        {medicationName} + {interaction.drug}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-foreground">{interaction.warning}</p>

                {interaction.recommendation && (
                  <div className="bg-muted rounded p-2 text-xs text-muted-foreground">
                    <strong>Recommendation:</strong> {interaction.recommendation}
                  </div>
                )}

                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => {
                    window.open(
                      `https://www.drugs.com/drug-interactions/${medicationName.toLowerCase()},${interaction.drug.toLowerCase()}.html`,
                      '_blank'
                    );
                  }}
                >
                  Learn More <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">Important Notice</AlertTitle>
          <AlertDescription className="text-blue-900 dark:text-blue-100 text-xs">
            This information is for reference only and should not replace professional medical advice.
            Always consult your healthcare provider before making changes to your medications.
          </AlertDescription>
        </Alert>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              window.print();
            }}
          >
            Export Report
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
