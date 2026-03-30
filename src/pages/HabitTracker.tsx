import { useState } from 'react';
import { Plus, Trash2, Check, Clock } from 'lucide-react';
import { useHabits, useUserStats } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function HabitTracker() {
  const { habits, toggleHabit, addHabit, deleteHabit } = useHabits();
  const { addPoints } = useUserStats();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('✅');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('30');

  const today = new Date().toISOString().split('T')[0];

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const handleToggle = (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (habit && !habit.completedDates.includes(today)) {
      addPoints(10);
    }
    toggleHabit(id, today);
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    addHabit(name, icon, scheduledTime || undefined, parseInt(duration) || 30);
    setName('');
    setIcon('✅');
    setScheduledTime('');
    setDuration('30');
    setOpen(false);
  };

  const getStreak = (habit: typeof habits[0]) => {
    let streak = 0;
    const d = new Date();
    while (true) {
      const dateStr = d.toISOString().split('T')[0];
      if (habit.completedDates.includes(dateStr)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return streak;
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold">Habits</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="gradient-primary p-2.5 rounded-xl">
              <Plus className="h-5 w-5 text-primary-foreground" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] rounded-2xl">
            <DialogHeader><DialogTitle>New Habit</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="flex gap-2">
                <Input className="w-16 text-center text-lg" value={icon} onChange={e => setIcon(e.target.value)} maxLength={2} />
                <Input className="flex-1" placeholder="Habit name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="border border-border/50 rounded-xl p-3 space-y-2">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Schedule (optional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Time</label>
                    <Input type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Duration (min)</label>
                    <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="5" max="120" />
                  </div>
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full gradient-primary text-primary-foreground border-0">Add Habit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Day Headers */}
      <div className="glass-card p-4">
        <div className="grid items-center gap-2" style={{ gridTemplateColumns: '1fr repeat(7, 28px) 32px' }}>
          <div />
          {last7.map(d => (
            <div key={d} className="text-center">
              <p className="text-[10px] text-muted-foreground">{new Date(d + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)}</p>
              <p className={`text-xs font-medium ${d === today ? 'text-primary' : ''}`}>
                {new Date(d + 'T12:00:00').getDate()}
              </p>
            </div>
          ))}
          <div />
        </div>

        {/* Habit Rows */}
        {habits.map(habit => (
          <div key={habit.id} className="grid items-center gap-2 py-2 border-t border-border/50" style={{ gridTemplateColumns: '1fr repeat(7, 28px) 32px' }}>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm">{habit.icon}</span>
              <div className="min-w-0">
                <span className="text-xs font-medium truncate block">{habit.name}</span>
                {habit.scheduledTime && (
                  <span className="text-[9px] text-muted-foreground">{habit.scheduledTime}</span>
                )}
              </div>
              {getStreak(habit) > 0 && <span className="text-[10px] text-accent shrink-0">🔥{getStreak(habit)}</span>}
            </div>
            {last7.map(d => {
              const done = habit.completedDates.includes(d);
              const isToday = d === today;
              return (
                <button
                  key={d}
                  onClick={() => isToday ? handleToggle(habit.id) : toggleHabit(habit.id, d)}
                  className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                    done ? 'gradient-success' : isToday ? 'border-2 border-primary/30' : 'bg-secondary'
                  }`}
                >
                  {done && <Check className="h-3.5 w-3.5 text-success-foreground" />}
                </button>
              );
            })}
            <button onClick={() => deleteHabit(habit.id)} className="text-muted-foreground hover:text-destructive transition-colors justify-self-center">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {habits.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">Add your first habit!</p>
        )}
      </div>
    </div>
  );
}
