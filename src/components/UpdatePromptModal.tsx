import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

export const UpdatePromptModal: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Automatic internal update registration
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Automatically check for updates in background every 15 minutes
        setInterval(() => {
          r.update().catch(() => {});
        }, 15 * 60 * 1000);
      }
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  // Periodic internal check
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        // Check for updates when app gains focus
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then((reg) => {
            reg?.update().catch(() => {});
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (!showPrompt) return null;

  const handleAccept = async () => {
    setIsUpdating(true);
    try {
      // Internal automatic update without opening external browser
      await updateServiceWorker(true);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      window.location.reload();
    }
  };

  const handleCancel = () => {
    setNeedRefresh(false);
    setShowPrompt(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border-2 border-[#0056b3] text-center relative">
        <div className="w-12 h-12 rounded-2xl bg-[#FFE600] border-2 border-yellow-400 flex items-center justify-center text-[#002d62] mx-auto mb-3 shadow-xs">
          <RefreshCw className={`w-6 h-6 ${isUpdating ? 'animate-spin' : ''}`} />
        </div>

        {/* Solo debe decir: Hay una nueva versión */}
        <h3 className="text-base font-black text-[#002d62]">
          {isUpdating ? 'Actualizando...' : 'Hay una nueva versión'}
        </h3>

        {/* Botones: Cancelar y Aceptar */}
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button
            type="button"
            disabled={isUpdating}
            onClick={handleCancel}
            className="py-2.5 px-3 rounded-xl border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-100 active:scale-95 transition disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={handleAccept}
            className="py-2.5 px-3 rounded-xl bg-[#0056b3] hover:bg-[#004494] text-white font-black text-xs shadow-md border-b-2 border-[#002d62] active:translate-y-0.5 active:border-b-0 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isUpdating ? (
              <span>Cargando...</span>
            ) : (
              <span>Aceptar</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
