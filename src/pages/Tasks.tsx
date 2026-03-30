import { useState } from 'react';
import { Plus, Trash2, Check, Clock, Pencil } from 'lucide-react';
import { useTasks, useUserStats, type Priority, type Category, type Task } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { scheduleTaskReminder, cancelTaskReminder } from '@/lib/notifications';

const priorityColors: Record<Priority, string> = {
  high: 'bg-destructive',
  medium: 'bg-accent',
  low: 'bg-success',
};

const categoryLabels: Record<Category, string> = {
  assignment: '📝 Assignment',
  exam: '📚 Exam',
  project: '🔬 Project',
  personal: '🎯 Personal',
};

export default function Tasks() {
  const { tasks, addTask, toggleTask, deleteTask, updateTask } = useTasks();
  const { addPoints } = useUserStats();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('assignment');
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [duration, setDuration] = useState('60');

  const resetForm = () => {
    setTitle(''); setDescription(''); setDeadline('');
    setDuration('60'); setCategory('assignment'); setPriority('medium');
  };

  const handleAdd = () => {
    if (!title.trim() || !deadline) return;
    const task = addTask({
      title, description, category, priority, deadline,
      duration: parseInt(duration) || 60,
    });
    addPoints(5);
    scheduleTaskReminder(task.id, task.title, task.deadline);
    resetForm();
    setOpen(false);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setCategory(task.category);
    setPriority(task.priority);
    setDeadline(task.deadline);
    setDuration(String(task.duration || 60));
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingTask || !title.trim() || !deadline) return;
    updateTask(editingTask.id, {
      title, description, category, priority, deadline,
      duration: parseInt(duration) || 60,
    });
    if (!editingTask.completed) {
      scheduleTaskReminder(editingTask.id, title, deadline);
    }
    resetForm();
    setEditingTask(null);
    setEditOpen(false);
  };

  const handleToggle = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      addPoints(task.completed ? -task.points : task.points);
      if (!task.completed) cancelTaskReminder(id);
    }
    toggleTask(id);
  };

  const handleDelete = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const pointsToDeduct = 5 + (task.completed ? task.points : 0);
      addPoints(-pointsToDeduct);
    }
    cancelTaskReminder(id);
    deleteTask(id);
  };

  const filtered = tasks.filter(t =>
    filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed
  );

  const taskFormFields = (
    <div className="space-y-3 mt-2">
      <Input placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} />
      <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
      <div className="grid grid-cols-2 gap-3">
        <Select value={category} onValueChange={v => setCategory(v as Category)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">🟢 Low</SelectItem>
            <SelectItem value="medium">🟡 Medium</SelectItem>
            <SelectItem value="high">🔴 High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Deadline</label>
        <Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} />
      </div>
      <div className="border border-border/50 rounded-xl p-3 space-y-2">
        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
          <Clock className="h-3 w-3" /> Duration (optional)
        </p>
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Duration (minutes)</label>
          <Input type="number" placeholder="60" value={duration} onChange={e => setDuration(e.target.value)} min="15" max="240" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <button className="gradient-primary p-2.5 rounded-xl">
              <Plus className="h-5 w-5 text-primary-foreground" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] rounded-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
            </DialogHeader>
            {taskFormFields}
            <Button onClick={handleAdd} className="w-full gradient-primary text-primary-foreground border-0">Create Task</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) { resetForm(); setEditingTask(null); } }}>
        <DialogContent className="max-w-[90vw] rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {taskFormFields}
          <Button onClick={handleSaveEdit} className="w-full gradient-primary text-primary-foreground border-0">Save Changes</Button>
        </DialogContent>
      </Dialog>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'active', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12 text-sm">No tasks yet. Create one!</p>
        )}
        {filtered.map(task => (
          <div key={task.id} className={`glass-card p-3 flex items-start gap-3 ${task.completed ? 'opacity-60' : ''}`}>
            <button
              onClick={() => handleToggle(task.id)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                task.completed ? 'bg-primary border-primary' : 'border-muted-foreground/30'
              }`}
            >
              {task.completed && <Check className="h-3 w-3 text-primary-foreground" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
              {task.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <div className={`w-1.5 h-1.5 rounded-full ${priorityColors[task.priority]}`} />
                <span className="text-[10px] text-muted-foreground">{new Date(task.deadline).toLocaleString()}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{task.category}</span>
                {task.startTime && task.endTime && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" /> {task.startTime}-{task.endTime}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => handleEdit(task)} className="text-muted-foreground hover:text-primary transition-colors mt-0.5">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(task.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
