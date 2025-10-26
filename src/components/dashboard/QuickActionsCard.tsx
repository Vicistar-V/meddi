import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Camera, Pill } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsCardProps {
  onAddMedication: () => void;
}

export const QuickActionsCard = ({ onAddMedication }: QuickActionsCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="border-2 bg-gradient-warm-cream backdrop-blur-sm sticky top-6">
      <div className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Quick Actions
        </h3>
        
        <div className="space-y-2">
          <Button
            onClick={onAddMedication}
            variant="outline"
            className="w-full justify-start gap-3 h-12"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <span>Add Medication</span>
          </Button>

          <Button
            onClick={() => navigate('/verify')}
            variant="outline"
            className="w-full justify-start gap-3 h-12"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Camera className="h-4 w-4 text-primary" />
            </div>
            <span>Scan Prescription</span>
          </Button>

          <Button
            onClick={() => navigate('/history')}
            variant="outline"
            className="w-full justify-start gap-3 h-12"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Pill className="h-4 w-4 text-primary" />
            </div>
            <span>View All Medications</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};
