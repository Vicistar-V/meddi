import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  header: ReactNode;
  mainContent: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

export const DashboardLayout = ({
  header,
  mainContent,
  sidebar,
  className
}: DashboardLayoutProps) => {
  return (
    <div className={cn("container mx-auto px-4 py-6 pb-32", className)}>
      {/* Header - Full Width */}
      <div className="mb-6">
        {header}
      </div>

      {/* Main Content + Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main Content */}
        <div className="space-y-6">
          {mainContent}
        </div>

        {/* Sidebar - Desktop Only */}
        {sidebar && (
          <aside className="hidden lg:block space-y-6">
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  );
};
