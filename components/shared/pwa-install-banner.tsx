"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare, Smartphone, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(true); // Default hidden until hydrated

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed)
    const isAppStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isAppStandalone);
    if (isAppStandalone) return;

    // 2. Check dismissal preference (respect user for 7 days)
    const dismissedAt = localStorage.getItem("ark-fit-pwa-dismissed-at");
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) {
        return;
      }
    }

    setDismissed(false);

    // 3. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // 4. Capture Chromium install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDismissed(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowIosGuide(false);
    localStorage.setItem("ark-fit-pwa-dismissed-at", Date.now().toString());
  };

  if (isStandalone || dismissed) {
    return null;
  }

  // Only show if there's an install prompt or it's iOS Safari
  if (!deferredPrompt && !isIos) {
    return null;
  }

  return (
    <>
      {/* Subtle Floating Install Banner */}
      <aside
        aria-label="Install ARK FIT Application"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#1E40AF] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
              A
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                Install ARK FIT App
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                Fast offline access & instant push alerts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="h-8 px-3 rounded-lg bg-[#1E40AF] hover:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss installation prompt"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Safari Specific Step-by-Step Installation Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl relative animate-in slide-in-from-bottom-6 duration-200">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#1E40AF] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                A
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Install on iPhone / iPad</h3>
                <p className="text-[11px] text-slate-500">2 quick steps in Safari</p>
              </div>
            </div>

            <ol className="space-y-3.5 text-xs text-slate-700 my-4">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-50 text-[#1E40AF] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Tap the <strong className="font-semibold text-slate-900">Share button</strong> (
                  <Share className="w-3.5 h-3.5 inline text-[#1E40AF] -mt-0.5" />) in the Safari navigation bar at the bottom.
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-50 text-[#1E40AF] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="font-semibold text-slate-900">Add to Home Screen</strong> (
                  <PlusSquare className="w-3.5 h-3.5 inline text-[#1E40AF] -mt-0.5" />).
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full mt-2 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
