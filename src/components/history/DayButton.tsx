import { format } from 'date-fns';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DayAdherence } from '@/hooks/useSimpleHistory';

interface DayButtonProps {
  date: Date;
  adherence: DayAdherence;
  onClick: () => void;
}

export const DayButton = ({ date, adherence, onClick }: DayButtonProps) => {
  const dayLabel = format(date, 'EEE');
  const dayNumber = format(date, 'd');

  const getAdherenceIcon = () => {
    switch (adherence) {
      case 'perfect':
        return <Check className="h-5 w-5 text-green-600" />;
      case 'partial':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'none':
        return <span className="text-red-600 text-lg font-bold">✕</span>;
      case 'no-schedule':
        return <span className="text-muted-foreground">—</span>;
    }
  };

  const getBackgroundClass = () => {
    switch (adherence) {
      case 'perfect':
        return 'bg-green-50 hover:bg-green-100 border-green-200';
      case 'partial':
        return 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200';
      case 'none':
        return 'bg-red-50 hover:bg-red-100 border-red-200';
      case 'no-schedule':
        return 'bg-muted/30 hover:bg-muted/50 border-border';
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-1 p-3 rounded-lg border transition-colors',
        getBackgroundClass()
      )}
    >
      <span className="text-xs text-muted-foreground font-medium">{dayLabel}</span>
      <span className="text-sm font-semibold">{dayNumber}</span>
      {getAdherenceIcon()}
    </button>
  );
};
