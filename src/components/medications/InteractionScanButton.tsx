import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Medication } from '@/hooks/useMedications';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface InteractionResult {
  medicationId: string;
  medicationName: string;
  interactions: any[];
}

interface InteractionScanButtonProps {
  medications: Medication[];
  onInteractionFound?: (results: InteractionResult[]) => void;
}

export const InteractionScanButton = ({
  medications,
  onInteractionFound,
}: InteractionScanButtonProps) => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<InteractionResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const scanAllInteractions = async () => {
    if (medications.length < 2) {
      toast({
        title: 'Not enough medications',
        description: 'You need at least 2 medications to check for interactions.',
      });
      return;
    }

    setIsScanning(true);
    const allInteractions: InteractionResult[] = [];

    try {
      for (const medication of medications) {
        const { data, error } = await supabase.functions.invoke('drug-interaction-checker', {
          body: { medication_name: medication.name }
        });

        if (error) {
          console.error(`Failed to check interactions for ${medication.name}:`, error);
          continue;
        }

        if (data?.interactions && data.interactions.length > 0) {
          allInteractions.push({
            medicationId: medication.id,
            medicationName: medication.name,
            interactions: data.interactions
          });
        }
      }

      setScanResults(allInteractions);
      setShowResults(true);

      if (onInteractionFound) {
        onInteractionFound(allInteractions);
      }

      if (allInteractions.length === 0) {
        toast({
          title: 'No interactions found',
          description: 'Your medications appear to be safe to take together.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Interactions detected',
          description: `Found potential interactions with ${allInteractions.length} medication(s).`,
        });
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        variant: 'destructive',
        title: 'Scan failed',
        description: 'Could not complete interaction scan. Please try again.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={scanAllInteractions}
        disabled={isScanning || medications.length < 2}
        className="w-full bg-primary hover:bg-primary/90"
      >
        {isScanning ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Scanning...
          </>
        ) : (
          <>
            <Shield className="h-4 w-4 mr-2" />
            Check Drug Safety
          </>
        )}
      </Button>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {scanResults.length === 0 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-success" />
                  No Interactions Found
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Interaction Scan Results
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {scanResults.length === 0
                ? 'Your medications appear to be safe to take together.'
                : `Found potential interactions with ${scanResults.length} medication(s).`}
            </DialogDescription>
          </DialogHeader>

          {scanResults.length > 0 && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                {scanResults.map((result) => (
                  <Card key={result.medicationId} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">{result.medicationName}</h4>
                      <Badge variant="destructive">
                        {result.interactions.length} interaction{result.interactions.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {result.interactions.map((interaction: any, idx: number) => (
                        <div
                          key={idx}
                          className="text-sm bg-muted rounded p-2"
                        >
                          <div className="font-medium text-foreground mb-1">
                            Interacts with: {interaction.drug}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {interaction.warning}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
