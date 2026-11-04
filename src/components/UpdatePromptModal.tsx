import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Download } from 'lucide-react';
import {
  checkForRemoteUpdate,
  APP_VERSION,
  VERSION_STORAGE_KEY,
  LATEST_APK_URL,
  RemoteVersionInfo,
} from '../utils/version';
import { playTapSound, triggerVibration } from '../utils/feedback';

interface UpdatePromptModalProps {
  forceOpen?: boolean;
  forcedRemoteInfo?: RemoteVersionInfo | null;
  onCloseForced?: () => void;
}

export const UpdatePromptModal: React.FC<UpdatePromptModalProps> = ({
  forceOpen = false,
  forcedRemoteInfo = null,
  onCloseForced,
}) => {
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [remoteInfo, setRemoteInfo] = useState<RemoteVersionInfo | null>(null);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined);

  // 1. Service Worker auto-check
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
        registration.update().catch(() => {});
        // Periodic check every 5 minutes in background
        setInterval(() => {
          registration.update().catch(() => {});
        }, 5 * 60 * 1000);
      }
    },
  });

  // 2. Query GitHub Releases and remote version
  const performUpdateCheck = useCallback(async () => {
    if (swRegistrationRef.current) {
      swRegistrationRef.current.update().catch(() => {});
    }

    const { hasUpdate, remoteInfo: info } = await checkForRemoteUpdate();
    if (hasUpdate && info) {
      setRemoteInfo(info);
      setShowPrompt(true);
      return true;
    }
    return false;
  }, []);

  // Initial check on mount only
  useEffect(() => {
    performUpdateCheck();
  }, [performUpdateCheck]);

  // Synchronize when forced open from manual click
  useEffect(() => {
    if (forceOpen) {
      if (forcedRemoteInfo) {
        setRemoteInfo(forcedRemoteInfo);
      }
      setShowPrompt(true);
    }
  }, [forceOpen, forcedRemoteInfo]);

  // If ServiceWorker signals needRefresh, show prompt
  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  if (!showPrompt) return null;

  const handleAccept = async () => {
    playTapSound();
    triggerVibration([30, 60]);
    setIsUpdating(true);

    const downloadUrl = remoteInfo?.downloadUrl || LATEST_APK_URL;

    try {
      // 1. Direct APK download trigger
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'Control-Diario-latest.apk');
      link.setAttribute('target', '_blank');
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 1000);

      // 2. Refresh ServiceWorker cache for web users
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }

      try {
        await updateServiceWorker(true);
      } catch {
        // ignore
      }

      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        } catch {
          // ignore
        }
      }

      localStorage.removeItem(`${VERSION_STORAGE_KEY}_DISMISSED`);

      setTimeout(() => {
        setIsUpdating(false);
        setShowPrompt(false);
        onCloseForced?.();
      }, 1500);
    } catch {
      window.location.href = downloadUrl;
    }
  };

  const handleCancel = () => {
    playTapSound();
    if (remoteInfo?.version) {
      localStorage.setItem(`${VERSION_STORAGE_KEY}_DISMISSED`, remoteInfo.version);
    }
    setNeedRefresh(false);
    setShowPrompt(false);
    onCloseForced?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border-2 border-[#0056b3] text-center relative animate-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-2xl bg-[#FFE600] border-2 border-yellow-400 flex items-center justify-center text-[#002d62] mx-auto mb-3 shadow-xs">
          {isUpdating ? (
            <Download className="w-6 h-6 animate-bounce text-[#0056b3]" />
          ) : (
            <RefreshCw className="w-6 h-6 text-[#002d62]" />
          )}
        </div>

        {/* Solo debe decir: Hay una nueva versión */}
        <h3 className="text-base font-black text-[#002d62]">
          {isUpdating ? 'Descargando actualización...' : 'Hay una nueva versión'}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {isUpdating
            ? 'Iniciando descarga en segundo plano...'
            : remoteInfo?.version
            ? `Disponible ${remoteInfo.version}`
            : 'Se aplicarán las mejoras de forma interna.'}
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
            {isUpdating ? <span>Descargando...</span> : <span>Aceptar</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
