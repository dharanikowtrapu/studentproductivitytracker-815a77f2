import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Calendar, Timer, BarChart3, Settings, Heart, GraduationCap, Sparkles } from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/schedule', icon: GraduationCap, label: 'Schedule' },
  { path: '/focus', icon: Timer, label: 'Focus' },
  { path: '/habits', icon: Heart, label: 'Habits' },
  { path: '/inspiration', icon: Sparkles, label: 'Inspire' },
  { path: '/analytics', icon: BarChart3, label: 'Stats' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <main
  className="flex-1 overflow-y-scroll overscroll-contain"
  style={{
    WebkitOverflowScrolling: 'touch',
    paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 24px))',
    scrollbarWidth: 'thin',
    scrollbarColor: 'hsl(var(--border)) transparent',
  }}
>
        <Outlet />
      </main>
      <nav
        className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 12px)',
        }}
      >
        <div className="flex items-center justify-around max-w-lg mx-auto px-1 py-1.5">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all min-w-0 ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'drop-shadow-[0_0_6px_hsl(172_66%_50%/0.5)]' : ''}`} />
                <span className="text-[10px] font-medium truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
