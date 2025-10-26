import { Home, Pill, Calendar, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      name: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      label: 'Home'
    },
    {
      name: 'Medications',
      icon: Pill,
      path: '/medications',
      label: 'Medications'
    },
    {
      name: 'History',
      icon: Calendar,
      path: '/history',
      label: 'History'
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/settings',
      label: 'Settings'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/98 backdrop-blur-lg supports-[backdrop-filter]:bg-background/95 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            const Icon = tab.icon;

            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 py-3 px-2 transition-all active:scale-95',
                  'min-h-[64px] max-w-[100px]',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-6 w-6 transition-transform', isActive && 'fill-primary/20 scale-110')} />
                <span className="text-xs font-medium leading-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
