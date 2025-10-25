import { Layers, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MarkingMode = 'card' | 'list';

interface MarkingModeToggleProps {
  mode: MarkingMode;
  onModeChange: (mode: MarkingMode) => void;
}

export const MarkingModeToggle = ({ mode, onModeChange }: MarkingModeToggleProps) => {
  return (
    <div className="flex items-center justify-center gap-1 p-1 bg-secondary rounded-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onModeChange('card')}
        className={cn(
          "flex items-center gap-2 transition-all",
          mode === 'card' && "bg-background shadow-sm"
        )}
      >
        <Layers className="h-4 w-4" />
        <span className="text-sm">Card Mode</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onModeChange('list')}
        className={cn(
          "flex items-center gap-2 transition-all",
          mode === 'list' && "bg-background shadow-sm"
        )}
      >
        <List className="h-4 w-4" />
        <span className="text-sm">List Mode</span>
      </Button>
    </div>
  );
};
