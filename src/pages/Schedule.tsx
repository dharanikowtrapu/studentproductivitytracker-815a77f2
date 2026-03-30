import { useState } from 'react';
import { Plus, Trash2, Calendar, BookOpen, Clock, Lightbulb, Droplets } from 'lucide-react';
import { useTimetable, useTasks, useHabits, type ClassSlot } from '@/lib/store';
import { generateStudyPlan, getWaterReminderTimes } from '@/lib/studyPlanner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Schedule() {
  const { slots, addSlot, deleteSlot } = useTimetable();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const [open, setOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [showPlan, setShowPlan] = useState(false);

  // Form state
  const [subject, setSubject] = useState('');
  const [location, setLocation] = useState('');
  const [day, setDay] = useState(String(new Date().getDay()));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const handleAdd = () => {
    if (!subject.trim()) return;
    addSlot({ subject, location, day: Number(day), startTime, endTime });
    setSubject(''); setLocation(''); setOpen(false);
  };

  const daySlots = slots
    .filter(s => s.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const studyPlan = generateStudyPlan(tasks, slots, selectedDay, habits);
  const waterTimes = getWaterReminderTimes();

  return (
    <div className="p-4 pb-8 max-w-lg mx-auto space-y-4 min-h-0">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="gradient-primary p-2.5 rounded-xl">
              <Plus className="h-5 w-5 text-primary-foreground" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Class</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Subject name" value={subject} onChange={e => setSubject(e.target.value)} />
              <Input placeholder="Location (optional)" value={location} onChange={e => setLocation(e.target.value)} />
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dayNames.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Start Time</label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">End Time</label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleAdd} className="w-full gradient-primary text-primary-foreground border-0">Add Class</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Day selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {shortDays.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors shrink-0 ${
              selectedDay === i
                ? 'gradient-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Toggle between Timetable and Study Plan */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowPlan(false)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            !showPlan ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
          }`}
        >
          <Calendar className="h-4 w-4" /> Classes
        </button>
        <button
          onClick={() => setShowPlan(true)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            showPlan ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
          }`}
        >
          <Lightbulb className="h-4 w-4" /> Study Plan
        </button>
      </div>

      {!showPlan ? (
        /* Timetable View */
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground">{dayNames[selectedDay]}'s Classes</h2>
          {daySlots.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No classes on {dayNames[selectedDay]}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Tap + to add a class</p>
            </div>
          ) : (
            daySlots.map(slot => (
              <div key={slot.id} className="glass-card p-3 flex items-center gap-3">
                <div className="w-1 h-12 rounded-full shrink-0" style={{ background: slot.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{slot.subject}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {slot.startTime} - {slot.endTime}
                    </span>
                    {slot.location && (
                      <span className="text-xs text-muted-foreground">📍 {slot.location}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteSlot(slot.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Study Plan View */
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-muted-foreground">
            Suggested Schedule — {dayNames[selectedDay]}
          </h2>
          <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2">
            📊 {daySlots.length} class{daySlots.length !== 1 ? 'es' : ''} · {tasks.filter(t => !t.completed).length} tasks · {habits.length} habits · 6 AM – 9 PM window
          </p>

          {studyPlan.length === 0 && (
            <div className="text-center py-8">
              <Lightbulb className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No study sessions to suggest</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Add tasks or habits to get suggestions</p>
            </div>
          )}

          {studyPlan.map(block => (
            <div key={block.id} className="glass-card p-3 flex items-center gap-3">
              <div className={`w-1 h-12 rounded-full shrink-0 ${
                block.type === 'habit' ? 'bg-primary' :
                block.priority === 'high' ? 'bg-destructive' :
                block.priority === 'medium' ? 'bg-accent' : 'bg-success'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {block.type === 'habit' ? (
                    <span className="text-sm">🔄</span>
                  ) : (
                    <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                  )}
                  <p className="text-sm font-medium truncate">{block.taskTitle}</p>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {block.startTime} - {block.endTime}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{block.reason}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Water Reminders Section */}
          <div className="mt-4">
            <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
              <Droplets className="h-4 w-4 text-primary" /> Water Reminders (5 AM – 7 PM)
            </h3>
            <div className="glass-card p-3">
              <div className="flex flex-wrap gap-1.5">
                {waterTimes.map(time => (
                  <span key={time} className="text-[10px] px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                    💧 {time}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Every 45 minutes · Notifications enabled automatically</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
