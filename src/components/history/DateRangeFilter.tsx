import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface DateRangeFilterProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  presets: {
    label: string;
    days: number;
  }[];
}

export const DateRangeFilter = ({ dateRange, onDateRangeChange, presets }: DateRangeFilterProps) => {
  const handlePresetClick = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onDateRangeChange({ from, to });
  };

  return (
    <Card className="bg-gradient-warm-cream shadow-cream">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">Filter by Date Range</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Preset Buttons */}
            {presets.map(preset => (
              <Button
                key={preset.days}
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(preset.days)}
                className={cn(
                  "text-xs",
                  dateRange?.from && 
                  Math.abs(new Date().getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24) <= preset.days + 1 &&
                  Math.abs(new Date().getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24) >= preset.days - 1 &&
                  "bg-primary text-primary-foreground"
                )}
              >
                {preset.label}
              </Button>
            ))}

            {/* Custom Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left text-xs font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM d, yyyy")} -{" "}
                        {format(dateRange.to, "MMM d, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    <span>Custom Range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={onDateRangeChange}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {dateRange?.from && (
          <div className="mt-2 text-xs text-muted-foreground">
            Showing data from{" "}
            <span className="font-medium text-foreground">
              {format(dateRange.from, "MMMM d, yyyy")}
            </span>
            {dateRange.to && (
              <>
                {" "}to{" "}
                <span className="font-medium text-foreground">
                  {format(dateRange.to, "MMMM d, yyyy")}
                </span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
