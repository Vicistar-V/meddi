import { useState } from 'react';
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
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const activeIndex = navigationItems.findIndex(
    (item) => location.pathname === item.path
  );

  // Calculate active indicator position based on active index
  const getIndicatorStyle = () => {
    if (activeIndex === -1) return { left: '-100px', opacity: 0 };
    
    const itemCount = navigationItems.length;
    const itemWidth = 80; // w-20
    const totalWidth = itemCount * itemWidth;
    const startPosition = (320 - totalWidth) / 2; // Center items in 320px container
    
    const leftPosition = startPosition + (activeIndex * itemWidth) + (itemWidth / 2);
    
    return {
      left: `${leftPosition}px`,
      transform: 'translateX(-50%)',
      opacity: 1,
    };
  };

  return (
    <nav 
      className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex justify-center px-6">
        <div 
          className="pointer-events-auto max-w-[320px] w-full rounded-[32px] border-2 border-white/40 bg-gradient-warm-cream/90 backdrop-blur-2xl shadow-2xl shadow-black/10 px-4 py-3"
          role="tablist"
        >
          <div className="relative flex items-center justify-evenly h-[68px] gap-2">
            {/* Morphing Circle Active Indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-[72px] h-[72px] rounded-full bg-primary/10 border border-primary/20 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] animate-spring-in"
              style={getIndicatorStyle()}
              aria-hidden="true"
            />

            {/* Navigation Items */}
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isHovered = hoveredItem === item.id;
              const showLabel = isActive || isHovered;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    'relative flex items-center justify-center w-20 h-[68px] rounded-2xl',
                    'transition-all duration-200 ease-out',
                    'hover:scale-105 active:scale-95',
                    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    'group'
                  )}
                  aria-label={item.ariaLabel}
                  aria-current={isActive ? 'page' : undefined}
                  role="tab"
                  aria-selected={isActive}
                >
                  <Icon
                    className={cn(
                      'h-7 w-7 stroke-[2.5] transition-all duration-300',
                      isActive
                        ? 'text-primary scale-110 animate-nav-icon-bounce'
                        : 'text-muted-foreground/60 group-hover:text-foreground group-hover:scale-105'
                    )}
                    aria-hidden="true"
                  />
                  
                  {/* Floating Tooltip Label */}
                  {showLabel && (
                    <div 
                      className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium shadow-lg animate-float-up whitespace-nowrap pointer-events-none"
                    >
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
