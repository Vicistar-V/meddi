import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Medication, Schedule, MedicationLog } from '@/hooks/useMedications';
import { ChevronDown, ChevronUp, MoreVertical, Pencil, Trash2, Clock, Calendar, TrendingUp, Plus, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { InteractionWarningBanner } from './InteractionWarningBanner';

interface MedicationListItemProps {
  medication: Medication;
  schedules: Schedule[];
  logs: MedicationLog[];
  adherenceRate: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSchedule?: (medicationId: string) => void;
  onEditSchedule?: (schedule: Schedule) => void;
  onDeleteSchedule?: (scheduleId: string) => void;
  interactions?: any[];
  onViewInteractionDetails?: () => void;
}

export const MedicationListItem = ({
  medication,
  schedules,
  logs,
  adherenceRate,
  onEdit,
  onDelete,
  onAddSchedule,
  onEditSchedule,
  onDeleteSchedule,
  interactions = [],
  onViewInteractionDetails,
}: MedicationListItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate schedule summary
  const scheduleCount = schedules.length;
  const schedulePreview = schedules.length > 0 
    ? `${scheduleCount}x daily` 
    : 'No schedules';

  // Get adherence color
  const getAdherenceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAdherenceBadgeVariant = (rate: number): "default" | "secondary" | "destructive" | "outline" => {
    if (rate >= 80) return 'default';
    if (rate >= 50) return 'secondary';
    return 'destructive';
  };

  return (
    <Card className="bg-gradient-cream shadow-warm border-border/50 transition-all duration-200 hover:shadow-lg">
      <div className="p-4">
        {/* Interaction Warning Banner */}
        {interactions.length > 0 && onViewInteractionDetails && (
          <InteractionWarningBanner
            medicationId={medication.id}
            medicationName={medication.name}
            interactions={interactions}
            onViewDetails={onViewInteractionDetails}
            onDismiss={() => {
              // Store dismissal in localStorage
              localStorage.setItem(`dismissed-interaction-${medication.id}`, 'true');
            }}
          />
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-foreground truncate">
                {medication.name}
              </h3>
              {interactions.length > 0 && (
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              )}
              <span className="text-sm text-muted-foreground">{medication.dosage}</span>
            </div>
            {medication.instructions && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {medication.instructions}
              </p>
            )}
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(medication.id)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Medication
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(medication.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Quick Info */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>{schedulePreview}</span>
          </div>
          
          {schedules.length > 0 && (
            <Badge variant={getAdherenceBadgeVariant(adherenceRate)} className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              {adherenceRate}% adherence
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-auto h-7 px-2 text-xs"
          >
            {isExpanded ? (
              <>
                Collapse <ChevronUp className="h-3.5 w-3.5 ml-1" />
              </>
            ) : (
              <>
                Expand <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </>
            )}
          </Button>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Schedules
              </h4>
              {onAddSchedule && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddSchedule(medication.id)}
                  className="h-7 px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Schedule
                </Button>
              )}
            </div>

            {schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No schedules configured</p>
            ) : (
              <div className="space-y-2">
                {schedules.map((schedule) => {
                  const scheduleLogs = logs.filter(log => log.schedule_id === schedule.id);
                  const takenCount = scheduleLogs.filter(log => log.status === 'taken').length;
                  const totalCount = scheduleLogs.length;
                  
                  return (
                    <div
                      key={schedule.id}
                      className="bg-card rounded-lg p-3 border border-border/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              {schedule.time_to_take}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {(schedule.days_of_week as string[]).join(', ')}
                          </p>
                          {totalCount > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Taken {takenCount}/{totalCount} times
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {onEditSchedule && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditSchedule(schedule)}
                              className="h-7 px-2 text-xs"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                          {onDeleteSchedule && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteSchedule(schedule.id)}
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
