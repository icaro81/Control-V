import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

export const UpdatePromptModal: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Automatically check for updates every 30 minutes in the background
        setInterval(() => {
          r.update().catch(() => {});
        }, 30 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  if (!showPrompt) return null;

  const handleUpdate = async () => {
    // When updating, local storage database is 100% preserved
    await updateServiceWorker(true);
    setShowPrompt(false);
  };

  const handleCancel = () => {
    setNeedRefresh(false);
    setShowPrompt(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border-2 border-[#0056b3] text-center relative">
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-[#FFE600] border-2 border-yellow-400 flex items-center justify-center text-[#002d62] mx-auto mb-3 shadow-sm">
          <RefreshCw className="w-7 h-7 animate-spin-slow" />
        </div>

        <h3 className="text-lg font-black text-[#002d62]">
          Hay una actualización disponible
        </h3>

        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
          Se ha descargado una nueva versión de la aplicación. Tus datos guardados se mantienen intactos.
        </p>

        <div className="grid grid-cols-2 gap-2.5 mt-5">
          <button
            type="button"
            onClick={handleCancel}
            className="py-3 px-4 rounded-xl border border-slate-300 font-bold text-xs text-slate-600 hover:bg-slate-100 active:scale-95 transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleUpdate}
            className="py-3 px-4 rounded-xl bg-[#0056b3] hover:bg-[#004494] text-white font-black text-xs shadow-md border-b-2 border-[#002d62] active:translate-y-0.5 active:border-b-0 transition flex items-center justify-center gap-1.5"
          >
            <span>Actualizar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
