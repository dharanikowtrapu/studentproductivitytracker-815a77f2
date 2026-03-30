import { useTasks, useFocusSessions, useMoodLog, useUserStats } from '@/lib/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { useState } from 'react';
import { toast } from 'sonner';

const COLORS = ['hsl(172,66%,50%)', 'hsl(38,92%,55%)', 'hsl(152,60%,45%)', 'hsl(0,72%,55%)'];

const moodEmojis = [
  { value: 1, emoji: '😫', label: 'Tired' },
  { value: 2, emoji: '😰', label: 'Stressed' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Happy' },
];

const energyEmojis = [
  { value: 1, emoji: '🪫', label: 'Drained' },
  { value: 2, emoji: '😴', label: 'Low' },
  { value: 3, emoji: '⚡', label: 'Normal' },
  { value: 4, emoji: '🔥', label: 'High' },
  { value: 5, emoji: '💥', label: 'Peak' },
];

export default function Analytics() {
  const { tasks } = useTasks();
  const { sessions } = useFocusSessions();
  const { moods, logMood } = useMoodLog();
  const { stats } = useUserStats();
  const [moodVal, setMoodVal] = useState(3);
  const [energyVal, setEnergyVal] = useState(3);

  // Task completion by category
  const categoryData = ['assignment', 'exam', 'project', 'personal'].map(cat => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    completed: tasks.filter(t => t.category === cat && t.completed).length,
    pending: tasks.filter(t => t.category === cat && !t.completed).length,
  }));

  // Completion rate
  const completed = tasks.filter(t => t.completed).length;
  const completionData = [
    { name: 'Completed', value: completed },
    { name: 'Pending', value: tasks.length - completed },
  ];

  // Focus sessions last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const focusData = last7.map(date => ({
    day: new Date(date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }),
    minutes: sessions.filter(s => s.date.startsWith(date)).reduce((sum, s) => sum + s.duration, 0),
  }));

  // Mood data
  const moodData = moods.slice(-7).map(m => ({
    date: new Date(m.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }),
    mood: m.mood,
    energy: m.energy,
  }));

  // Mood vs Productivity data - correlate mood with tasks completed on same day
  const moodProductivityData = moods.slice(-14).map(m => {
    const dayTasks = tasks.filter(t => t.completed && t.createdAt.startsWith(m.date)).length;
    const dayFocus = sessions.filter(s => s.date.startsWith(m.date)).reduce((sum, s) => sum + s.duration, 0);
    return {
      date: new Date(m.date + 'T12:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      mood: m.mood,
      tasksCompleted: dayTasks,
      focusMins: dayFocus,
    };
  });

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Track your progress</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="text-2xl font-bold">{tasks.length}</p>
          <p className="text-[10px] text-muted-foreground">Total Tasks</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-2xl font-bold">{completed}</p>
          <p className="text-[10px] text-muted-foreground">Completed</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-2xl font-bold">{sessions.reduce((s, x) => s + x.duration, 0)}</p>
          <p className="text-[10px] text-muted-foreground">Focus Mins</p>
        </div>
      </div>

      {/* Task Completion Pie */}
      {tasks.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-semibold text-sm mb-3">Task Completion</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={completionData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" strokeWidth={0}>
                {completionData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {completionData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-xs text-muted-foreground">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks by Category */}
      {tasks.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-semibold text-sm mb-3">Tasks by Category</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Bar dataKey="completed" fill="hsl(172,66%,50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="hsl(38,92%,55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Focus Trend */}
      <div className="glass-card p-4">
        <h3 className="font-semibold text-sm mb-3">Focus Time (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={focusData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip />
            <Bar dataKey="minutes" fill="hsl(152,60%,45%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mood Logger with Emoji Selection */}
      <div className="glass-card p-4">
        <h3 className="font-semibold text-sm mb-1">Log Today's Mood & Energy</h3>
        <p className="text-xs text-muted-foreground mb-4">Your mood affects productivity — tracking helps you find patterns!</p>
        <div className="space-y-4">
          {/* Mood Emoji Selector */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">How are you feeling?</p>
            <div className="flex justify-between">
              {moodEmojis.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMoodVal(m.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    moodVal === m.value
                      ? 'bg-primary/15 scale-110 ring-2 ring-primary/30'
                      : 'hover:bg-secondary'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy Emoji Selector */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Energy level?</p>
            <div className="flex justify-between">
              {energyEmojis.map(e => (
                <button
                  key={e.value}
                  onClick={() => setEnergyVal(e.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    energyVal === e.value
                      ? 'bg-accent/15 scale-110 ring-2 ring-accent/30'
                      : 'hover:bg-secondary'
                  }`}
                >
                  <span className="text-2xl">{e.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{e.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => { logMood(moodVal, energyVal); toast.success('Mood logged!'); }} className="w-full gradient-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium">
            Log Mood
          </button>
        </div>
      </div>

      {/* Mood Trend */}
      {moodData.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-semibold text-sm mb-3">Mood & Energy Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={moodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Line type="monotone" dataKey="mood" stroke="hsl(172,66%,50%)" strokeWidth={2} dot={{ r: 3 }} name="Mood" />
              <Line type="monotone" dataKey="energy" stroke="hsl(38,92%,55%)" strokeWidth={2} dot={{ r: 3 }} name="Energy" />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Mood vs Productivity Chart */}
      {moodProductivityData.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="font-semibold text-sm mb-1">Mood vs Productivity</h3>
          <p className="text-xs text-muted-foreground mb-3">See how your mood correlates with tasks completed and focus time</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={moodProductivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Bar yAxisId="left" dataKey="mood" fill="hsl(172,66%,50%)" radius={[4, 4, 0, 0]} name="Mood" />
              <Bar yAxisId="left" dataKey="tasksCompleted" fill="hsl(38,92%,55%)" radius={[4, 4, 0, 0]} name="Tasks Done" />
              <Bar yAxisId="right" dataKey="focusMins" fill="hsl(152,60%,45%)" radius={[4, 4, 0, 0]} name="Focus Mins" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
