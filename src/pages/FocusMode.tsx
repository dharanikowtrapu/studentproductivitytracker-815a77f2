import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import { useFocusSessions, useUserStats } from '@/lib/store';
import { sendFocusCompleteNotification, requestNotificationPermission } from '@/lib/notifications';

interface SavedTimerState {
  endTime: number;
  isBreak: boolean;
  workMins: number;
  breakMins: number;
  subject: string;
  sessionsCompleted: number;
}

function loadTimerState(): SavedTimerState | null {
  try {
    const s = localStorage.getItem('focusTimerState');
    if (!s) return null;
    const state = JSON.parse(s) as SavedTimerState;
    // Only valid if endTime is in the future
    if (state.endTime > Date.now()) return state;
    // Timer expired while away - we'll handle completion
    return { ...state, endTime: 0 };
  } catch { return null; }
}

function saveTimerState(state: SavedTimerState | null) {
  if (state) localStorage.setItem('focusTimerState', JSON.stringify(state));
  else localStorage.removeItem('focusTimerState');
}

export default function FocusMode() {
  const { addSession } = useFocusSessions();
  const { addPoints } = useUserStats();

  const [workMins, setWorkMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [subject, setSubject] = useState('');
  const intervalRef = useRef<number | null>(null);
  const endTimeRef = useRef<number>(0);

  // Restore timer state on mount
  useEffect(() => {
    const saved = loadTimerState();
    if (!saved) return;

    setWorkMins(saved.workMins);
    setBreakMins(saved.breakMins);
    setSubject(saved.subject);
    setSessionsCompleted(saved.sessionsCompleted);
    setIsBreak(saved.isBreak);

    if (saved.endTime === 0) {
      // Timer completed while app was closed
      if (!saved.isBreak) {
        setSessionsCompleted(saved.sessionsCompleted + 1);
        addSession({ date: new Date().toISOString(), duration: saved.workMins, subject: saved.subject || 'General' });
        addPoints(saved.workMins);
        sendFocusCompleteNotification(false);
      }
      setIsBreak(!saved.isBreak);
      setTimeLeft(saved.isBreak ? saved.workMins * 60 : saved.breakMins * 60);
      saveTimerState(null);
    } else {
      // Timer still running
      const remaining = Math.ceil((saved.endTime - Date.now()) / 1000);
      setTimeLeft(remaining);
      endTimeRef.current = saved.endTime;
      setIsRunning(true);
    }
  }, []);

  const totalTime = isBreak ? breakMins * 60 : workMins * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleComplete = useCallback(() => {
    if (!isBreak) {
      setSessionsCompleted(p => p + 1);
      addSession({ date: new Date().toISOString(), duration: workMins, subject: subject || 'General' });
      addPoints(workMins);
    }
    sendFocusCompleteNotification(isBreak);
    setIsBreak(prev => !prev);
    setTimeLeft(isBreak ? workMins * 60 : breakMins * 60);
    setIsRunning(false);
    saveTimerState(null);
  }, [isBreak, workMins, breakMins, addSession, addPoints, subject]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          handleComplete();
          return;
        }
        setTimeLeft(remaining);
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, handleComplete]);

  const startTimer = () => {
    requestNotificationPermission();
    const endTime = Date.now() + timeLeft * 1000;
    endTimeRef.current = endTime;
    setIsRunning(true);
    saveTimerState({
      endTime,
      isBreak,
      workMins,
      breakMins,
      subject,
      sessionsCompleted,
    });
  };

  const pauseTimer = () => {
    setIsRunning(false);
    saveTimerState(null);
  };

  const reset = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(workMins * 60);
    saveTimerState(null);
  };

  const circumference = 2 * Math.PI * 120;

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6 flex flex-col items-center">
      <div className="flex items-center justify-between w-full pt-2">
        <h1 className="text-2xl font-bold">Focus Mode</h1>
        <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-xl bg-secondary">
          <Settings2 className="h-5 w-5 text-secondary-foreground" />
        </button>
      </div>

      {showSettings && (
        <div className="glass-card p-4 w-full space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Subject</label>
            <input
              className="w-full mt-1 bg-secondary rounded-lg px-3 py-2 text-sm outline-none border-0"
              placeholder="e.g., Math, CS, Reading"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Work (min)</label>
              <input type="number" min={1} max={120} value={workMins}
                onChange={e => { setWorkMins(+e.target.value); if (!isRunning) setTimeLeft(+e.target.value * 60); }}
                className="w-full mt-1 bg-secondary rounded-lg px-3 py-2 text-sm outline-none border-0"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Break (min)</label>
              <input type="number" min={1} max={60} value={breakMins}
                onChange={e => setBreakMins(+e.target.value)}
                className="w-full mt-1 bg-secondary rounded-lg px-3 py-2 text-sm outline-none border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Timer Circle */}
      <div className="relative flex items-center justify-center my-4">
        <svg width="264" height="264" className="-rotate-90">
          <circle cx="132" cy="132" r="120" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
          <circle cx="132" cy="132" r="120" fill="none"
            stroke={isBreak ? "hsl(var(--success))" : "hsl(var(--primary))"}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-xs text-muted-foreground mb-1">{isBreak ? 'Break Time' : 'Focus Time'}</span>
          <span className="text-5xl font-bold tabular-nums">{formatTime(timeLeft)}</span>
          <span className="text-xs text-muted-foreground mt-2">Session {sessionsCompleted + 1}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button onClick={reset} className="p-3 rounded-xl bg-secondary">
          <RotateCcw className="h-5 w-5 text-secondary-foreground" />
        </button>
        <button
          onClick={() => isRunning ? pauseTimer() : startTimer()}
          className="gradient-primary p-5 rounded-2xl shadow-lg shadow-primary/20"
        >
          {isRunning ? <Pause className="h-7 w-7 text-primary-foreground" /> : <Play className="h-7 w-7 text-primary-foreground ml-0.5" />}
        </button>
        <div className="w-[44px]" /> {/* spacer */}
      </div>

      {/* Session Count */}
      <div className="glass-card p-4 w-full text-center">
        <p className="text-sm text-muted-foreground">Sessions completed today</p>
        <p className="text-3xl font-bold mt-1">{sessionsCompleted}</p>
      </div>
    </div>
  );
}
