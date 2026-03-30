// Notification utility for Study Buddy
import { toast } from 'sonner';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return true;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return true;
  const result = await Notification.requestPermission();
  return true;
}

export function sendNotification(title: string, body: string, type: 'info' | 'warning' | 'success' = 'info', tag?: string) {
  const icon = type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  toast(title, {
    description: body,
    icon,
    duration: 8000,
    position: 'top-center',
  });

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: tag || undefined,
      badge: '/favicon.ico',
    });
  }
}

// Schedule a reminder before a deadline
let taskTimers: Map<string, number> = new Map();

export function scheduleTaskReminder(taskId: string, title: string, deadline: string, durationMinutes?: number) {
  cancelTaskReminder(taskId);
  const deadlineTime = new Date(deadline).getTime();
  const now = Date.now();

  // Reminder 1: 24 hours before deadline
  const oneDayBefore = deadlineTime - 24 * 60 * 60 * 1000;
  if (oneDayBefore > now) {
    const timerId = window.setTimeout(() => {
      sendNotification('📅 Task Due Tomorrow!', `"${title}" is due in 24 hours!`, 'warning', `task-day-${taskId}`);
      taskTimers.delete(`${taskId}-day`);
    }, oneDayBefore - now);
    taskTimers.set(`${taskId}-day`, timerId);
  }

  // Reminder 2: Duration-based (e.g. 2hr task → remind 2hrs before deadline)
  const durationMs = (durationMinutes || 30) * 60 * 1000;
  const durationBefore = deadlineTime - durationMs;
  // Only schedule if it doesn't overlap with the 24hr reminder (avoid duplicate near same time)
  if (durationBefore > now && Math.abs(durationBefore - oneDayBefore) > 5 * 60 * 1000) {
    const durationLabel = (durationMinutes || 30) >= 60
      ? `${Math.round((durationMinutes || 30) / 60)} hour${Math.round((durationMinutes || 30) / 60) !== 1 ? 's' : ''}`
      : `${durationMinutes || 30} minutes`;
    const timerId = window.setTimeout(() => {
      sendNotification('⏰ Time to Start!', `"${title}" is due in ${durationLabel} — start now!`, 'warning', `task-dur-${taskId}`);
      taskTimers.delete(`${taskId}-dur`);
    }, durationBefore - now);
    taskTimers.set(`${taskId}-dur`, timerId);
  }

  // Reminder 3: At the deadline
  if (deadlineTime > now) {
    const exactTimerId = window.setTimeout(() => {
      sendNotification('🚨 Task Due Now!', `"${title}" is due right now!`, 'warning', `task-exact-${taskId}`);
    }, deadlineTime - now);
    taskTimers.set(`${taskId}-exact`, exactTimerId);
  }
}

export function cancelTaskReminder(taskId: string) {
  const keys = [taskId, `${taskId}-exact`, `${taskId}-day`, `${taskId}-dur`];
  keys.forEach(key => {
    const timerId = taskTimers.get(key);
    if (timerId) { clearTimeout(timerId); taskTimers.delete(key); }
  });
}

export function sendFocusCompleteNotification(isBreak: boolean) {
  sendNotification(
    isBreak ? '☕ Break Over!' : '🎉 Focus Session Complete!',
    isBreak ? 'Time to get back to work!' : 'Great job! Take a well-deserved break.',
    'success',
    'focus-complete'
  );
}

export function sendHabitReminder() {
  sendNotification(
    '📋 Daily Habit Check',
    "Don't forget to track your habits today!",
    'info',
    'habit-reminder'
  );
}

export function sendWaterReminder() {
  sendNotification(
    '💧 Hydration Reminder',
    'Time to drink some water! Stay hydrated for better focus.',
    'info',
    'water-reminder'
  );
}

export function sendTestNotification() {
  sendNotification('🔔 Test Reminder', 'Your notifications are working!', 'success');
}

// Water reminder scheduler
let waterTimers: number[] = [];

export function scheduleWaterReminders() {
  // Clear existing water timers
  waterTimers.forEach(t => clearTimeout(t));
  waterTimers = [];

  const now = new Date();
  const startHour = 5; // 5 AM
  const endHour = 19; // 7 PM
  const intervalMinutes = 45;

  let cursor = new Date(now);
  cursor.setHours(startHour, 0, 0, 0);

  while (cursor.getHours() < endHour || (cursor.getHours() === endHour && cursor.getMinutes() === 0)) {
    const delay = cursor.getTime() - now.getTime();
    if (delay > 0) {
      const timerId = window.setTimeout(() => {
        sendWaterReminder();
      }, delay);
      waterTimers.push(timerId);
    }
    cursor = new Date(cursor.getTime() + intervalMinutes * 60 * 1000);
    if (cursor.getHours() >= endHour && cursor.getMinutes() > 0) break;
  }
}
