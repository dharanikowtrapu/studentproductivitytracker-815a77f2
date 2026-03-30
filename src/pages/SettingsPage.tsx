import { useState, useEffect } from 'react';
import { Moon, Sun, Trash2, Download, Droplets } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [waterReminders, setWaterReminders] = useState(() => {
    return localStorage.getItem('waterRemindersEnabled') !== 'false';
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  useEffect(() => {
    localStorage.setItem('waterRemindersEnabled', String(waterReminders));
    // Dispatch event so ReminderScheduler picks it up
    window.dispatchEvent(new CustomEvent('waterRemindersChanged', { detail: waterReminders }));
  }, [waterReminders]);

  const exportData = () => {
    const data = {
      tasks: localStorage.getItem('tasks'),
      habits: localStorage.getItem('habits'),
      focusSessions: localStorage.getItem('focusSessions'),
      userStats: localStorage.getItem('userStats'),
      moodLog: localStorage.getItem('moodLog'),
      timetable: localStorage.getItem('timetable'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'productivity-data.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    if (confirm('Are you sure? This will delete all your data.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="space-y-2">
        {/* Theme */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {dark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-accent" />}
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle dark theme</p>
            </div>
          </div>
          <button
            onClick={() => setDark(!dark)}
            className={`w-12 h-7 rounded-full transition-colors relative ${dark ? 'bg-primary' : 'bg-secondary'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-card absolute top-1 transition-transform ${dark ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Water Reminders */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Droplets className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Water Reminders</p>
              <p className="text-xs text-muted-foreground">Every 45 min (5 AM – 7 PM)</p>
            </div>
          </div>
          <Switch checked={waterReminders} onCheckedChange={setWaterReminders} />
        </div>

        {/* Export */}
        <button onClick={exportData} className="glass-card p-4 flex items-center gap-3 w-full text-left">
          <Download className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Export Data</p>
            <p className="text-xs text-muted-foreground">Download your data as JSON</p>
          </div>
        </button>

        {/* Clear */}
        <button onClick={clearData} className="glass-card p-4 flex items-center gap-3 w-full text-left">
          <Trash2 className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Clear All Data</p>
            <p className="text-xs text-muted-foreground">Reset everything</p>
          </div>
        </button>
      </div>

      <div className="glass-card p-4">
        <h3 className="font-semibold text-sm mb-2">About</h3>
        <p className="text-xs text-muted-foreground">Student Productivity Tracker v1.0</p>
        <p className="text-xs text-muted-foreground mt-1">Stay focused, stay productive! 🚀</p>
      </div>
    </div>
  );
}
