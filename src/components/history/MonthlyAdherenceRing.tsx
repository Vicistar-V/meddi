import { ProgressRing } from '@/components/ui/progress-ring';
import { Card, CardContent } from '@/components/ui/card';

interface MonthlyAdherenceRingProps {
  taken: number;
  total: number;
  percentage: number;
}

export const MonthlyAdherenceRing = ({
  taken,
  total,
  percentage,
}: MonthlyAdherenceRingProps) => {
  const getColorClass = () => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="bg-gradient-warm-cream border-none shadow-sm">
      <CardContent className="pt-8 pb-6 flex flex-col items-center">
        <div className={getColorClass()}>
          <ProgressRing progress={percentage} size={140} strokeWidth={12} />
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          {taken} of {total} doses taken this month
        </p>
      </CardContent>
    </Card>
  );
};
