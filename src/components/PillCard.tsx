import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PillCardProps {
  medicationName: string;
  dosage: string;
  time: string;
  status: 'taken' | 'upcoming' | 'missed';
  onMarkTaken?: () => void;
}

export const PillCard = ({ medicationName, dosage, time, status, onMarkTaken }: PillCardProps) => {
  return (
    <Card className={cn(
      'transition-all',
      status === 'taken' && 'border-success/30 bg-success-light',
      status === 'missed' && 'border-orange-500 bg-orange-50'
    )}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            status === 'taken' && 'bg-success',
            status === 'upcoming' && 'bg-primary',
            status === 'missed' && 'bg-orange-500'
          )}>
            {status === 'taken' ? (
              <Check className="h-6 w-6 text-white" />
            ) : (
              <Clock className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">{medicationName}</h3>
            <p className="text-sm text-muted-foreground">{dosage}</p>
            <p className="text-xs text-muted-foreground">{time}</p>
          </div>
        </div>
        {status === 'upcoming' && onMarkTaken && (
          <Button size="sm" onClick={onMarkTaken}>
            <Check className="mr-2 h-4 w-4" />
            Mark Taken
          </Button>
        )}
        {status === 'taken' && (
          <div className="text-sm font-medium text-success">Completed</div>
        )}
        {status === 'missed' && (
          <div className="text-sm font-medium text-orange-600">Missed</div>
        )}
      </CardContent>
    </Card>
  );
};