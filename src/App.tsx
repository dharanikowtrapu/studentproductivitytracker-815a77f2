import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import CalendarView from "./pages/CalendarView";
import FocusMode from "./pages/FocusMode";
import HabitTracker from "./pages/HabitTracker";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/SettingsPage";
import InstallPage from "./pages/InstallPage";
import Schedule from "./pages/Schedule";
import PinterestBoard from "./pages/PinterestBoard";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";
import { useTasks } from "./lib/store";
import { scheduleTaskReminder, scheduleWaterReminders } from "./lib/notifications";

const queryClient = new QueryClient();

function ThemeInit() {
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  }, []);
  return null;
}

// Global reminder scheduler
function ReminderScheduler() {
  const { tasks } = useTasks();
  const [waterEnabled, setWaterEnabled] = useState(() => {
    return localStorage.getItem('waterRemindersEnabled') !== 'false';
  });

  useEffect(() => {
    tasks.filter(t => !t.completed && t.deadline).forEach(t => {
      scheduleTaskReminder(t.id, t.title, t.deadline, t.duration);
    });
  }, [tasks]);

  // Listen for water reminder toggle changes
  useEffect(() => {
    const handler = (e: Event) => {
      setWaterEnabled((e as CustomEvent).detail);
    };
    window.addEventListener('waterRemindersChanged', handler);
    return () => window.removeEventListener('waterRemindersChanged', handler);
  }, []);

  // Schedule water reminders only when enabled
  useEffect(() => {
    if (!waterEnabled) return;
    scheduleWaterReminders();
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const delay = midnight.getTime() - now.getTime();
    const timer = window.setTimeout(() => {
      scheduleWaterReminders();
    }, delay);
    return () => clearTimeout(timer);
  }, [waterEnabled]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeInit />
      <ReminderScheduler />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/focus" element={<FocusMode />} />
            <Route path="/habits" element={<HabitTracker />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/install" element={<InstallPage />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/inspiration" element={<PinterestBoard />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
