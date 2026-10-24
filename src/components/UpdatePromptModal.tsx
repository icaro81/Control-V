import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Download } from 'lucide-react';

// Current installed version
export const APP_CURRENT_VERSION = 'v1.0.0';
// Target GitHub repository
export const GITHUB_REPO = 'icaro81/Control-V';

export const UpdatePromptModal: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [newVersionTag, setNewVersionTag] = useState<string>('');
  const [apkDownloadUrl, setApkDownloadUrl] = useState<string | null>(null);

  // 1. PWA Service Worker update listener (for Web/PWA mode)
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
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

  // 2. Native APK update checker against GitHub Releases
  useEffect(() => {
    const checkGitHubRelease = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        const latestTag = data.tag_name; // e.g. "v1.0.1"

        if (latestTag && latestTag !== APP_CURRENT_VERSION) {
          // Check if dismissed in this session
          const dismissedVersion = sessionStorage.getItem('dismissed_version');
          if (dismissedVersion === latestTag) return;

          // Find .apk asset in release
          const apkAsset = data.assets?.find((asset: { name: string; browser_download_url: string }) =>
            asset.name.toLowerCase().endsWith('.apk')
          );

          setNewVersionTag(latestTag);
          if (apkAsset?.browser_download_url) {
            setApkDownloadUrl(apkAsset.browser_download_url);
          } else {
            setApkDownloadUrl(data.html_url);
          }
          setShowPrompt(true);
        }
      } catch (err) {
        // Silently fail if offline or API limit reached
        console.debug('Error checking GitHub releases:', err);
      }
    };

    // Check on startup
    checkGitHubRelease();

    // Check every 30 minutes in the background
    const interval = setInterval(checkGitHubRelease, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!showPrompt) return null;

  const handleUpdate = async () => {
    if (apkDownloadUrl) {
      // Direct APK download from GitHub Release
      window.location.href = apkDownloadUrl;
      setShowPrompt(false);
      return;
    }

    if (needRefresh) {
      // PWA service worker refresh
      await updateServiceWorker(true);
      setShowPrompt(false);
    }
  };

  const handleCancel = () => {
    if (newVersionTag) {
      sessionStorage.setItem('dismissed_version', newVersionTag);
    }
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

        {newVersionTag && (
          <span className="inline-block mt-1 text-[11px] font-black bg-[#FFE600] text-[#002d62] px-2 py-0.5 rounded-full border border-yellow-400">
            Versión {newVersionTag}
          </span>
        )}

        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          {apkDownloadUrl
            ? 'Hay una nueva compilación de la APK en GitHub Releases. Puedes descargarla e instalarla ahora.'
            : 'Se ha descargado una nueva versión. Tus datos guardados se mantienen intactos.'}
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
            <Download className="w-3.5 h-3.5 text-[#FFE600]" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
