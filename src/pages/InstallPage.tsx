import { useState, useEffect } from 'react';
import { Download, Smartphone, Wifi, Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Smartphone, title: 'Works Like a Native App', desc: 'Launches from your home screen with a splash screen' },
    { icon: Wifi, title: 'Works Offline', desc: 'Access your tasks & habits even without internet' },
    { icon: Bell, title: 'Background Notifications', desc: 'Get reminders even when the app is minimized' },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <div className="pt-2 text-center">
        <img src="/pwa-icon-512.png" alt="Study Buddy" className="w-20 h-20 mx-auto rounded-2xl shadow-lg mb-4" />
        <h1 className="text-2xl font-bold">Install Study Buddy</h1>
        <p className="text-muted-foreground text-sm mt-2">Add to your home screen for the best experience</p>
      </div>

      <div className="space-y-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass-card p-4 flex items-start gap-3">
            <div className="gradient-primary p-2 rounded-xl shrink-0">
              <Icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {installed ? (
        <div className="glass-card p-5 text-center">
          <Check className="h-10 w-10 text-primary mx-auto mb-2" />
          <p className="font-semibold">App Installed!</p>
          <p className="text-sm text-muted-foreground mt-1">Open Study Buddy from your home screen.</p>
        </div>
      ) : deferredPrompt ? (
        <Button onClick={handleInstall} className="w-full gradient-primary text-primary-foreground border-0 h-12 text-base gap-2">
          <Download className="h-5 w-5" /> Install Now
        </Button>
      ) : (
        <div className="glass-card p-5 text-center space-y-3">
          <p className="font-medium text-sm">How to install manually:</p>
          <div className="text-xs text-muted-foreground space-y-2 text-left">
            <p><strong>Android Chrome:</strong> Tap ⋮ menu → "Add to Home Screen"</p>
            <p><strong>iPhone Safari:</strong> Tap Share ↑ → "Add to Home Screen"</p>
            <p><strong>Desktop Chrome:</strong> Click install icon in the address bar</p>
          </div>
        </div>
      )}
    </div>
  );
}
