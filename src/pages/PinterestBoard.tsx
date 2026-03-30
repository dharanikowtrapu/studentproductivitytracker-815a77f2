import { useState } from 'react';
import { Plus, Trash2, ExternalLink, Heart, Sparkles } from 'lucide-react';
import { usePinterestSettings } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const defaultBoards = [
  {
    title: '🧠 Study Motivation',
    url: 'https://www.pinterest.com/search/pins/?q=study%20motivation%20quotes',
  },
  {
    title: '💚 Mental Health',
    url: 'https://www.pinterest.com/search/pins/?q=mental%20health%20self%20care%20tips',
  },
  {
    title: '🌸 Emotional Wellness',
    url: 'https://www.pinterest.com/search/pins/?q=emotional%20health%20wellness',
  },
  {
    title: '✨ Positive Quotes',
    url: 'https://www.pinterest.com/search/pins/?q=positive%20quotes%20inspiration',
  },
];

const inspirationQuotes = [
  { text: "Your mental health matters more than any grade.", query: "mental+health+quotes" },
  { text: "Small progress is still progress. Keep going! 🌱", query: "progress+motivation+quotes" },
  { text: "Take breaks. Rest is productive too. ☕", query: "rest+self+care+quotes" },
  { text: "You are capable of amazing things. 💪", query: "you+are+capable+quotes" },
  { text: "One day at a time. One task at a time. 🎯", query: "one+day+at+a+time+quotes" },
];

export default function PinterestBoard() {
  const { settings, addBoardUrl, removeBoardUrl } = usePinterestSettings();
  const [addOpen, setAddOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const handleAddBoard = () => {
    if (!newUrl.trim()) return;
    addBoardUrl(newTitle ? `${newTitle}|||${newUrl}` : newUrl);
    setNewUrl('');
    setNewTitle('');
    setAddOpen(false);
  };

  const openOnPinterest = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Parse custom boards
  const customBoards = settings.boardUrls.map(entry => {
    const parts = entry.split('|||');
    return {
      title: parts.length > 1 ? parts[0] : '📌 Custom Board',
      url: parts.length > 1 ? parts[1] : parts[0],
    };
  });

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Inspiration
        </h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <button className="gradient-primary p-2.5 rounded-xl">
              <Plus className="h-5 w-5 text-primary-foreground" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] rounded-2xl">
            <DialogHeader><DialogTitle>Add Pinterest Board</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Board title (optional)" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <Input placeholder="Pinterest board or pin URL" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
              <p className="text-[10px] text-muted-foreground">Paste any Pinterest board URL, pin URL, or search URL</p>
              <Button onClick={handleAddBoard} className="w-full gradient-primary text-primary-foreground border-0">Add Board</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Default Inspiration Categories */}
      <div className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground">Explore Inspiration</h2>
        <div className="grid grid-cols-2 gap-3">
          {defaultBoards.map(board => (
            <button
              key={board.title}
              onClick={() => openOnPinterest(board.url)}
              className="glass-card p-4 flex flex-col items-center gap-2 hover:scale-[1.02] transition-transform text-left"
            >
              <span className="text-2xl">{board.title.split(' ')[0]}</span>
              <span className="text-xs font-medium text-center">{board.title.slice(board.title.indexOf(' ') + 1)}</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* User's Custom Boards */}
      {customBoards.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground">Your Boards</h2>
          {customBoards.map((board, i) => (
            <div key={i} className="glass-card p-3 flex items-center gap-3">
              <span className="text-lg">📌</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{board.title}</p>
                <button
                  onClick={() => openOnPinterest(board.url)}
                  className="text-xs text-primary truncate block hover:underline"
                >
                  {board.url}
                </button>
              </div>
              <button
                onClick={() => removeBoardUrl(settings.boardUrls[i])}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Inspiration Quotes - clickable, redirect to Pinterest */}
      <div className="glass-card p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" /> Quick Inspiration
        </h3>
        <div className="space-y-2">
          {inspirationQuotes.map((q, i) => (
            <button
              key={i}
              onClick={() => openOnPinterest(`https://www.pinterest.com/search/pins/?q=${q.query}`)}
              className="w-full bg-secondary/50 rounded-lg p-3 text-left hover:bg-secondary/80 transition-colors group"
            >
              <p className="text-xs text-foreground/80 italic">"{q.text}"</p>
              <p className="text-[10px] text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Explore on Pinterest <ExternalLink className="h-2.5 w-2.5" />
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
