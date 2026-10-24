import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { checkForRemoteUpdate, APP_VERSION, VERSION_STORAGE_KEY } from '../utils/version';
import { playTapSound, playSuccessSound, triggerVibration } from '../utils/feedback';

interface UpdatePromptModalProps {
  manualCheckTrigger?: number;
  onManualCheckResult?: (hasUpdate: boolean) => void;
}

export const UpdatePromptModal: React.FC<UpdatePromptModalProps> = ({
  manualCheckTrigger = 0,
  onManualCheckResult,
}) => {
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined);

  // 1. Service Worker auto-check with immediate registration
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onNeedRefresh() {
      setShowPrompt(true);
    },
    onRegisteredSW(swScriptUrl, registration) {
      swRegistrationRef.current = registration;
      if (registration) {
        // Force an immediate check right after registration
        registration.update().catch(() => {});

        // Automatically re-check for new versions every 60 seconds
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 1000);
      }
    },
  });

  // 2. Query both ServiceWorker update and remote version.json
  const performUpdateCheck = useCallback(async () => {
    // A. Trigger service worker check
    if (swRegistrationRef.current) {
      swRegistrationRef.current.update().catch(() => {});
    } else if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update().catch(() => {});
      });
    }

    // B. Direct HTTP check against /version.json (works seamlessly in APKs and PWAs)
    const { hasUpdate } = await checkForRemoteUpdate();
    if (hasUpdate) {
      setShowPrompt(true);
    }
    return hasUpdate;
  }, []);

  // Trigger check on mount
  useEffect(() => {
    // Initial check on load
    performUpdateCheck();

    // Check when user returns to app (Android foreground / tab switch)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        performUpdateCheck();
      }
    };

    const handleOnline = () => {
      performUpdateCheck();
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [performUpdateCheck]);

  // If ServiceWorker signals needRefresh, show prompt immediately
  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  // Handle manual trigger (e.g. from version button click)
  useEffect(() => {
    if (manualCheckTrigger > 0) {
      performUpdateCheck().then((hasUpdate) => {
        if (onManualCheckResult) {
          onManualCheckResult(hasUpdate || needRefresh);
        }
      });
    }
  }, [manualCheckTrigger, performUpdateCheck, needRefresh, onManualCheckResult]);

  if (!showPrompt) return null;

  const handleAccept = async () => {
    playTapSound();
    triggerVibration([30, 60]);
    setIsUpdating(true);

    try {
      // 1. Tell waiting service worker to skip waiting and activate
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          await reg.update().catch(() => {});
        }
      }

      // 2. Call pwa update
      try {
        await updateServiceWorker(true);
      } catch {
        // Fallback
      }

      // 3. Clear all CacheStorage to wipe old bundled HTML/JS
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        } catch {
          // Ignore
        }
      }

      // 4. Clear dismissed version flags
      localStorage.removeItem(`${VERSION_STORAGE_KEY}_DISMISSED`);

      // 5. Reload the app to run the new version
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch {
      window.location.reload();
    }
  };

  const handleCancel = () => {
    playTapSound();
    // Dismiss for this session
    localStorage.setItem(`${VERSION_STORAGE_KEY}_DISMISSED`, APP_VERSION);
    setNeedRefresh(false);
    setShowPrompt(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border-2 border-[#0056b3] text-center relative animate-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-2xl bg-[#FFE600] border-2 border-yellow-400 flex items-center justify-center text-[#002d62] mx-auto mb-3 shadow-xs">
          <RefreshCw className={`w-6 h-6 ${isUpdating ? 'animate-spin text-[#0056b3]' : ''}`} />
        </div>

        {/* Solo debe decir: Hay una nueva versión */}
        <h3 className="text-base font-black text-[#002d62]">
          {isUpdating ? 'Actualizando...' : 'Hay una nueva versión'}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {isUpdating ? 'Descargando e instalando...' : 'Se aplicarán las mejoras de forma interna.'}
        </p>

        {/* Botones: Cancelar y Aceptar */}
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button
            type="button"
            disabled={isUpdating}
            onClick={handleCancel}
            className="py-2.5 px-3 rounded-xl border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-100 active:scale-95 transition disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={handleAccept}
            className="py-2.5 px-3 rounded-xl bg-[#0056b3] hover:bg-[#004494] text-white font-black text-xs shadow-md border-b-2 border-[#002d62] active:translate-y-0.5 active:border-b-0 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isUpdating ? <span>Cargando...</span> : <span>Aceptar</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
