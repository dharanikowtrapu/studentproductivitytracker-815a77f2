import { useEffect, useState } from 'react';
import { CheckSquare, Flame, Trophy, Timer, ArrowRight, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTasks, useUserStats, useHabits } from '@/lib/store';
import { requestNotificationPermission, sendHabitReminder, sendTestNotification } from '@/lib/notifications';

const quotes = [
  "The secret of getting ahead is getting started.",
  "Focus on being productive instead of busy.",
  "Small daily improvements lead to stunning results.",
  "Don't watch the clock; do what it does. Keep going.",
  "Success is the sum of small efforts repeated daily.",
  "You don't have to be great to start, but you have to start to be great.",
  "Discipline is the bridge between goals and accomplishment.",
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
  "It always seems impossible until it's done.",
  "Your limitation—it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Hardships often prepare ordinary people for an extraordinary destiny.",
];

function getDailyQuote() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return quotes[dayOfYear % quotes.length];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { stats, updateStreak } = useUserStats();
  const { habits } = useHabits();
  const [notifEnabled, setNotifEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );

  useEffect(() => { updateStreak(); }, []);

  // Reminders are now handled globally in App.tsx ReminderScheduler

  // Daily habit reminder at 8 PM
  useEffect(() => {
    const now = new Date();
    const eightPM = new Date(now);
    eightPM.setHours(20, 0, 0, 0);
    let delay = eightPM.getTime() - now.getTime();
    if (delay < 0) delay += 86400000;
    const timer = window.setTimeout(() => sendHabitReminder(), delay);
    return () => clearTimeout(timer);
  }, []);

  const enableNotifications = async () => {
    await requestNotificationPermission();
    setNotifEnabled(true);
    sendTestNotification();
  };

  const today = new Date().toISOString().split('T')[0];
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const habitsCompletedToday = habits.filter(h => h.completedDates.includes(today)).length;
  const quote = getDailyQuote();

  const upcomingTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">Let's make today productive!</p>
        </div>
        <button
          onClick={enableNotifications}
          className={`p-2.5 rounded-xl transition-colors ${notifEnabled ? 'gradient-primary' : 'bg-secondary'}`}
          title={notifEnabled ? 'Notifications on' : 'Enable notifications'}
        >
          <Bell className={`h-5 w-5 ${notifEnabled ? 'text-primary-foreground' : 'text-secondary-foreground'}`} />
        </button>
      </div>

      {/* Daily Quote - Vivid Card */}
      <div className="relative overflow-hidden rounded-2xl p-5 gradient-primary shadow-lg">
        <div className="absolute inset-0 opacity-20" style={{
          background: 'radial-gradient(circle at 20% 50%, hsl(38 92% 55% / 0.4), transparent 60%), radial-gradient(circle at 80% 30%, hsl(152 60% 45% / 0.4), transparent 50%)'
        }} />
        <p className="text-lg font-semibold text-primary-foreground relative z-10 leading-relaxed">
          ✨ "{quote}"
        </p>
        <p className="text-xs text-primary-foreground/70 mt-2 relative z-10">Daily Motivation</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="gradient-primary p-1.5 rounded-lg">
              <Trophy className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Points</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalPoints}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="gradient-accent p-1.5 rounded-lg">
              <Flame className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Streak</span>
          </div>
          <p className="text-2xl font-bold">{stats.streak} <span className="text-sm font-normal text-muted-foreground">days</span></p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="gradient-success p-1.5 rounded-lg">
              <CheckSquare className="h-4 w-4 text-success-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>
          <p className="text-2xl font-bold">{pendingTasks}</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-secondary p-1.5 rounded-lg">
              <Timer className="h-4 w-4 text-secondary-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">Habits Today</span>
          </div>
          <p className="text-2xl font-bold">{habitsCompletedToday}<span className="text-sm font-normal text-muted-foreground">/{habits.length}</span></p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button onClick={() => navigate('/focus')} className="flex-1 gradient-primary text-primary-foreground rounded-xl p-4 font-medium text-sm flex items-center justify-center gap-2">
          <Timer className="h-4 w-4" /> Start Focus
        </button>
        <button onClick={() => navigate('/tasks')} className="flex-1 bg-secondary text-secondary-foreground rounded-xl p-4 font-medium text-sm flex items-center justify-center gap-2">
          <CheckSquare className="h-4 w-4" /> Add Task
        </button>
      </div>

      {/* Upcoming Tasks */}
      {upcomingTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Upcoming Tasks</h2>
            <button onClick={() => navigate('/tasks')} className="text-primary text-xs flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {upcomingTasks.map(task => (
              <div key={task.id} className="glass-card p-3 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  task.priority === 'high' ? 'bg-destructive' : task.priority === 'medium' ? 'bg-accent' : 'bg-success'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(task.deadline).toLocaleDateString()}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{task.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {stats.badges.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Badges Earned</h2>
          <div className="flex gap-2 flex-wrap">
            {stats.badges.map(badge => (
              <span key={badge} className="glass-card px-3 py-1.5 text-xs font-medium">
                {badge === 'century' ? '💯 Century' : badge === '500club' ? '🏆 500 Club' : badge === 'weekStreak' ? '🔥 Week Streak' : '🌟 Month Streak'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
