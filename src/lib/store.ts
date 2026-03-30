import { useState, useEffect } from 'react';

export type Priority = 'low' | 'medium' | 'high';
export type Category = 'assignment' | 'exam' | 'project' | 'personal';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  deadline: string;
  completed: boolean;
  createdAt: string;
  points: number;
  startTime?: string; // "HH:mm"
  endTime?: string; // "HH:mm"
  duration?: number; // minutes
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDates: string[];
  scheduledTime?: string; // "HH:mm"
  duration?: number; // minutes (default 30)
}

export interface FocusSession {
  id: string;
  date: string;
  duration: number; // minutes
  subject: string;
}

export interface MoodEntry {
  date: string;
  mood: number; // 1-5
  energy: number; // 1-5
}

export interface UserStats {
  totalPoints: number;
  streak: number;
  lastActiveDate: string;
  badges: string[];
}

export interface PinterestSettings {
  boardUrls: string[];
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => loadFromStorage('tasks', []));

  useEffect(() => { saveToStorage('tasks', tasks); }, [tasks]);

  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'points'>) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completed: false,
      points: task.priority === 'high' ? 30 : task.priority === 'medium' ? 20 : 10,
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  return { tasks, addTask, toggleTask, deleteTask, updateTask };
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(() => loadFromStorage('habits', [
    { id: '1', name: 'Coding Practice', icon: '💻', completedDates: [] },
    { id: '2', name: 'Reading', icon: '📖', completedDates: [] },
    { id: '3', name: 'Exercise', icon: '🏃', completedDates: [] },
    { id: '4', name: 'Meditation', icon: '🧘', completedDates: [] },
  ]));

  useEffect(() => { saveToStorage('habits', habits); }, [habits]);

  const toggleHabit = (id: string, date: string) => {
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h;
      const dates = h.completedDates.includes(date)
        ? h.completedDates.filter(d => d !== date)
        : [...h.completedDates, date];
      return { ...h, completedDates: dates };
    }));
  };

  const addHabit = (name: string, icon: string, scheduledTime?: string, duration?: number) => {
    setHabits(prev => [...prev, {
      id: crypto.randomUUID(),
      name,
      icon,
      completedDates: [],
      scheduledTime,
      duration: duration || 30,
    }]);
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  return { habits, toggleHabit, addHabit, deleteHabit };
}

export function useFocusSessions() {
  const [sessions, setSessions] = useState<FocusSession[]>(() => loadFromStorage('focusSessions', []));

  useEffect(() => { saveToStorage('focusSessions', sessions); }, [sessions]);

  const addSession = (session: Omit<FocusSession, 'id'>) => {
    setSessions(prev => [...prev, { ...session, id: crypto.randomUUID() }]);
  };

  return { sessions, addSession };
}

export function useUserStats() {
  const [stats, setStats] = useState<UserStats>(() => loadFromStorage('userStats', {
    totalPoints: 0,
    streak: 0,
    lastActiveDate: '',
    badges: [],
  }));

  useEffect(() => { saveToStorage('userStats', stats); }, [stats]);

  const updateStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    setStats(prev => {
      if (prev.lastActiveDate === today) return prev;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStreak = prev.lastActiveDate === yesterday ? prev.streak + 1 : 1;
      return { ...prev, streak: newStreak, lastActiveDate: today };
    });
  };

  const addPoints = (points: number) => {
    const today = new Date().toISOString().split('T')[0];
    setStats(prev => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStreak = prev.lastActiveDate === yesterday || prev.lastActiveDate === today
        ? (prev.lastActiveDate === today ? prev.streak : prev.streak + 1)
        : 1;
      const newTotal = Math.max(0, prev.totalPoints + points);
      const newBadges = [...prev.badges];
      if (newTotal >= 100 && !newBadges.includes('century')) newBadges.push('century');
      if (newTotal >= 500 && !newBadges.includes('500club')) newBadges.push('500club');
      if (newStreak >= 7 && !newBadges.includes('weekStreak')) newBadges.push('weekStreak');
      if (newStreak >= 30 && !newBadges.includes('monthStreak')) newBadges.push('monthStreak');
      return { totalPoints: newTotal, streak: newStreak, lastActiveDate: today, badges: newBadges };
    });
  };

  return { stats, addPoints, updateStreak };
}

export interface ClassSlot {
  id: string;
  day: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  subject: string;
  location: string;
  color: string;
}

const slotColors = [
  'hsl(172 66% 50%)', 'hsl(38 92% 55%)', 'hsl(152 60% 45%)',
  'hsl(280 60% 55%)', 'hsl(200 70% 50%)', 'hsl(340 65% 55%)',
];

export function useTimetable() {
  const [slots, setSlots] = useState<ClassSlot[]>(() => loadFromStorage('timetable', []));

  useEffect(() => { saveToStorage('timetable', slots); }, [slots]);

  const addSlot = (slot: Omit<ClassSlot, 'id' | 'color'>) => {
    const color = slotColors[slots.length % slotColors.length];
    setSlots(prev => [...prev, { ...slot, id: crypto.randomUUID(), color }]);
  };

  const deleteSlot = (id: string) => {
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  return { slots, addSlot, deleteSlot };
}

export function useMoodLog() {
  const [moods, setMoods] = useState<MoodEntry[]>(() => loadFromStorage('moodLog', []));

  useEffect(() => { saveToStorage('moodLog', moods); }, [moods]);

  const logMood = (mood: number, energy: number) => {
    const today = new Date().toISOString().split('T')[0];
    setMoods(prev => {
      const existing = prev.findIndex(m => m.date === today);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { date: today, mood, energy };
        return updated;
      }
      return [...prev, { date: today, mood, energy }];
    });
  };

  return { moods, logMood };
}

export function usePinterestSettings() {
  const [settings, setSettings] = useState<PinterestSettings>(() =>
    loadFromStorage('pinterestSettings', { boardUrls: [] })
  );

  useEffect(() => { saveToStorage('pinterestSettings', settings); }, [settings]);

  const addBoardUrl = (url: string) => {
    setSettings(prev => ({ ...prev, boardUrls: [...prev.boardUrls, url] }));
  };

  const removeBoardUrl = (url: string) => {
    setSettings(prev => ({ ...prev, boardUrls: prev.boardUrls.filter(u => u !== url) }));
  };

  return { settings, addBoardUrl, removeBoardUrl };
}
