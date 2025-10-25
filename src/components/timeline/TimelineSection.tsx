import { ReactNode } from 'react';

interface TimelineSectionProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const TimelineSection = ({ 
  title, 
  subtitle, 
  icon, 
  children,
}: TimelineSectionProps) => {
  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        {icon && (
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Section Content */}
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};
