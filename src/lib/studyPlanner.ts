import { Task, ClassSlot, Habit } from './store';

export interface StudyBlock {
  id: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  taskTitle: string;
  taskId: string;
  priority: 'low' | 'medium' | 'high';
  reason: string;
  type: 'study' | 'habit' | 'water';
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function generateStudyPlan(
  tasks: Task[],
  timetableSlots: ClassSlot[],
  dayOfWeek: number,
  habits: Habit[] = []
): StudyBlock[] {
  const now = new Date();
  const isToday = dayOfWeek === now.getDay();

  // Sort tasks: urgent deadlines first (within 3 hours), then by priority, then by deadline
  const pendingTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => {
      const aDeadline = new Date(a.deadline).getTime();
      const bDeadline = new Date(b.deadline).getTime();
      const aHoursLeft = (aDeadline - now.getTime()) / (1000 * 60 * 60);
      const bHoursLeft = (bDeadline - now.getTime()) / (1000 * 60 * 60);

      // Urgent tasks (due within 3 hours) always come first
      const aUrgent = aHoursLeft <= 3;
      const bUrgent = bHoursLeft <= 3;
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      if (aUrgent && bUrgent) return aHoursLeft - bHoursLeft; // most urgent first

      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return aDeadline - bDeadline;
    });

  // Get today's class slots
  const todayClasses = timetableSlots
    .filter(s => s.day === dayOfWeek)
    .map(s => ({ start: timeToMinutes(s.startTime), end: timeToMinutes(s.endTime), subject: s.subject }))
    .sort((a, b) => a.start - b.start);

  // Define study window
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const roundedCurrent = Math.ceil(currentMinutes / 5) * 5;
  const dayStart = isToday ? Math.max(6 * 60, roundedCurrent) : 6 * 60;
  const dayEnd = 21 * 60;
  const minBlock = 15;
  const breakTime = 10; // reduced break between blocks for tighter scheduling

  // Collect fixed blocks
  const fixedBlocks: { start: number; end: number }[] = [];

  for (const cls of todayClasses) {
    fixedBlocks.push({ start: cls.start, end: cls.end });
  }

  // Tasks with specific start/end times
  const scheduledTaskBlocks: StudyBlock[] = [];
  const unscheduledTasks = [...pendingTasks];

  for (let i = unscheduledTasks.length - 1; i >= 0; i--) {
    const task = unscheduledTasks[i];
    if (task.startTime && task.endTime) {
      const start = timeToMinutes(task.startTime);
      const end = timeToMinutes(task.endTime);
      if (start >= dayStart && end <= dayEnd) {
        fixedBlocks.push({ start, end });
        scheduledTaskBlocks.push({
          id: crypto.randomUUID(),
          startTime: task.startTime,
          endTime: task.endTime,
          taskTitle: task.title,
          taskId: task.id,
          priority: task.priority,
          reason: '📌 Scheduled time',
          type: 'study',
        });
        unscheduledTasks.splice(i, 1);
      }
    }
  }

  // Habits with scheduled times
  const today = new Date().toISOString().split('T')[0];
  const habitBlocks: StudyBlock[] = [];
  for (const habit of habits) {
    if (habit.scheduledTime && !habit.completedDates.includes(today)) {
      const start = timeToMinutes(habit.scheduledTime);
      const duration = habit.duration || 30;
      const end = start + duration;
      if (start >= dayStart && end <= dayEnd) {
        fixedBlocks.push({ start, end });
        habitBlocks.push({
          id: crypto.randomUUID(),
          startTime: habit.scheduledTime,
          endTime: minutesToTime(end),
          taskTitle: `${habit.icon} ${habit.name}`,
          taskId: habit.id,
          priority: 'medium',
          reason: '🔄 Daily habit',
          type: 'habit',
        });
      }
    }
  }

  fixedBlocks.sort((a, b) => a.start - b.start);

  // Find free slots
  const freeSlots: { start: number; end: number }[] = [];
  let cursor = dayStart;

  for (const block of fixedBlocks) {
    if (block.start > cursor + minBlock) {
      freeSlots.push({ start: cursor, end: block.start });
    }
    cursor = Math.max(cursor, block.end + breakTime);
  }
  if (cursor < dayEnd - minBlock) {
    freeSlots.push({ start: cursor, end: dayEnd });
  }

  // Assign unscheduled tasks to free slots
  const autoBlocks: StudyBlock[] = [];
  let taskIdx = 0;

  const pomodoroSession = 25;
  const pomodoroBreak = 5;

  for (const slot of freeSlots) {
    if (taskIdx >= unscheduledTasks.length) break;
    let blockStart = slot.start;

    while (blockStart + minBlock <= slot.end && taskIdx < unscheduledTasks.length) {
      const task = unscheduledTasks[taskIdx];
      const taskDuration = task.duration || 60;

      const deadline = new Date(task.deadline);
      const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

      let reason = '';
      if (hoursUntilDeadline <= 0) reason = '🚨 OVERDUE!';
      else if (hoursUntilDeadline < 1) reason = '🚨 Due within an hour!';
      else if (hoursUntilDeadline < 3) reason = '🚨 Due in a few hours!';
      else if (hoursUntilDeadline < 24) reason = '⏰ Due today';
      else if (hoursUntilDeadline < 72) reason = '⏰ Due soon';
      else if (task.priority === 'high') reason = '🔴 High priority';
      else if (task.priority === 'medium') reason = '🟡 Medium priority';
      else reason = '📝 Scheduled study time';

      if (taskDuration <= 30) {
        const blockEnd = Math.min(blockStart + taskDuration, slot.end);
        autoBlocks.push({
          id: crypto.randomUUID(),
          startTime: minutesToTime(blockStart),
          endTime: minutesToTime(blockEnd),
          taskTitle: task.title,
          taskId: task.id,
          priority: task.priority,
          reason,
          type: 'study',
        });
        blockStart = blockEnd + breakTime;
      } else {
        let remaining = taskDuration;
        let sessionNum = 1;
        const totalSessions = Math.ceil(taskDuration / pomodoroSession);

        while (remaining > 0 && blockStart + pomodoroSession <= slot.end) {
          const sessionDuration = Math.min(pomodoroSession, remaining);
          const blockEnd = blockStart + sessionDuration;

          autoBlocks.push({
            id: crypto.randomUUID(),
            startTime: minutesToTime(blockStart),
            endTime: minutesToTime(blockEnd),
            taskTitle: `${task.title} (${sessionNum}/${totalSessions})`,
            taskId: task.id,
            priority: task.priority,
            reason: `${reason} 🍅 Pomodoro ${sessionNum}/${totalSessions}`,
            type: 'study',
          });

          remaining -= sessionDuration;
          sessionNum++;
          blockStart = blockEnd + (remaining > 0 ? pomodoroBreak : breakTime);
        }
      }

      taskIdx++;
    }
  }

  const allBlocks = [...scheduledTaskBlocks, ...habitBlocks, ...autoBlocks];
  allBlocks.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return allBlocks;
}

// Generate water reminder times: every 45 min from 5 AM to 7 PM
export function getWaterReminderTimes(): string[] {
  const times: string[] = [];
  let cursor = 5 * 60;
  const end = 19 * 60;
  while (cursor <= end) {
    times.push(minutesToTime(cursor));
    cursor += 45;
  }
  return times;
}
