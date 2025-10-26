import { Home, Calendar, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
  ariaLabel: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Home',
    icon: Home,
    path: '/dashboard',
    ariaLabel: 'Go to Dashboard',
  },
  {
    id: 'history',
    label: 'History',
    icon: Calendar,
    path: '/history',
    ariaLabel: 'View Medication History',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    ariaLabel: 'Open Settings',
  },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeIndex = navigationItems.findIndex(
    (item) => location.pathname === item.path
  );

  // Calculate active indicator position based on active index
  const getIndicatorStyle = () => {
    if (activeIndex === -1) return { left: '-100px' };
    
    const baseWidth = 100 / navigationItems.length;
    const centerOffset = baseWidth / 2;
    const leftPosition = activeIndex * baseWidth + centerOffset;
    
    return {
      left: `${leftPosition}%`,
      transform: 'translateX(-50%)',
    };
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-gradient-cream/80 backdrop-blur-xl shadow-warm"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4">
        <div className="relative flex items-center justify-around h-20 max-w-md mx-auto">
          {/* Sliding Active Indicator */}
          <div
            className="absolute bottom-2 h-14 w-16 rounded-2xl bg-gradient-warm-cream shadow-cream transition-all duration-300 ease-out"
            style={getIndicatorStyle()}
            aria-hidden="true"
          />

          {/* Navigation Items */}
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1.5 py-2 px-4 rounded-xl',
                  'min-w-[64px] min-h-[64px]',
                  'transition-all duration-200 ease-out',
                  'hover:scale-105 active:scale-95',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  'group'
                )}
                aria-label={item.ariaLabel}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={cn(
                    'h-6 w-6 stroke-[2] transition-all duration-200',
                    isActive
                      ? 'text-primary fill-primary/20 animate-nav-icon-bounce'
                      : 'text-muted-foreground group-hover:text-foreground group-hover:scale-110'
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'text-xs transition-all duration-200',
                    isActive
                      ? 'font-semibold text-primary'
                      : 'font-medium text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
