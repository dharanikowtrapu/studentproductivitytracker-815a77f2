import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasks } from '@/lib/store';

export default function CalendarView() {
  const { tasks } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getTasksForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.deadline.startsWith(dateStr));
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const selectedTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold">Calendar</h1>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg bg-secondary"><ChevronLeft className="h-4 w-4" /></button>
          <h2 className="font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={nextMonth} className="p-1.5 rounded-lg bg-secondary"><ChevronRight className="h-4 w-4" /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</div>
          ))}
          {days.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const dayTasks = getTasksForDay(day);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today;
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                  isSelected ? 'bg-primary text-primary-foreground' :
                  isToday ? 'bg-primary/20 text-primary font-bold' :
                  'hover:bg-secondary'
                }`}
              >
                {day}
                {dayTasks.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayTasks.slice(0, 3).map((t, j) => (
                      <div key={j} className={`w-1 h-1 rounded-full ${
                        t.priority === 'high' ? 'bg-destructive' : t.priority === 'medium' ? 'bg-accent' : 'bg-success'
                      }`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div>
          <h3 className="font-semibold mb-2">Tasks for {currentDate.toLocaleString('default', { month: 'short' })} {selectedDay}</h3>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks on this day</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map(task => (
                <div key={task.id} className="glass-card p-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    task.priority === 'high' ? 'bg-destructive' : task.priority === 'medium' ? 'bg-accent' : 'bg-success'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${task.completed ? 'line-through opacity-60' : ''}`}>{task.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{task.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
