import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Pill, Clock, Calendar, FileText } from 'lucide-react';
import { ManualEntryFormState } from '../AddMedicationManual';

interface MedicationPreviewCardProps {
  formData: ManualEntryFormState;
}

const DAYS_MAP: Record<string, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun'
};

export const MedicationPreviewCard = ({ formData }: MedicationPreviewCardProps) => {
  const hasBasicInfo = formData.name || formData.dosage;
  const hasSchedules = formData.schedules.length > 0;
  const hasInstructions = formData.instructions;

  return (
    <div className="sticky top-6">
      <Card className="p-6 bg-gradient-warm-cream shadow-warm border-border/50">
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Pill className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Live Preview</h3>
              <p className="text-xs text-muted-foreground">How your medication will look</p>
            </div>
          </div>

          {!hasBasicInfo && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Pill className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Start entering medication details to see a preview</p>
            </div>
          )}

          {hasBasicInfo && (
            <>
              {/* Name & Dosage */}
              <div>
                <h4 className="font-semibold text-foreground text-lg">
                  {formData.name || 'Medication Name'}
                </h4>
                {formData.dosage && (
                  <p className="text-sm text-muted-foreground">
                    {formData.dosage}{formData.dosageUnit}
                  </p>
                )}
                {formData.duration === 'limited' && (
                  <Badge variant="outline" className="text-xs mt-2">
                    Limited Time
                  </Badge>
                )}
              </div>

              {hasSchedules && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">
                        Schedules ({formData.schedules.length})
                      </span>
                    </div>
                    {formData.schedules.slice(0, 3).map((schedule) => (
                      <div key={schedule.id} className="text-xs text-muted-foreground pl-5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {new Date(`2000-01-01T${schedule.time}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                          <span>•</span>
                          <span>{schedule.days.map(d => DAYS_MAP[d]).join(', ')}</span>
                        </div>
                      </div>
                    ))}
                    {formData.schedules.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-5">
                        +{formData.schedules.length - 3} more
                      </p>
                    )}
                  </div>
                </>
              )}

              {hasInstructions && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">Instructions</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-5 line-clamp-3">
                      {formData.instructions}
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
