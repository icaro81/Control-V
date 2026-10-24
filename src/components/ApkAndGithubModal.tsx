import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Github,
  CheckCircle2,
  Copy,
  ExternalLink,
  Download,
  Terminal,
  Layers,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ApkAndGithubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkAndGithubModal: React.FC<ApkAndGithubModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install, isIOS, isAndroid } = usePWAInstall();
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const gitCommands = `# 1. Inicializar repositorio Git
git init
git add .
git commit -m "feat: APK de Control Diario de Visitas Efectivas"

# 2. Conectar a tu repositorio de GitHub
git branch -M main
git remote add origin https://github.com/TU_USUARIO/control-diario-apk.git
git push -u origin main`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl my-8 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Guía de APK y Subida a GitHub
              </h2>
              <p className="text-xs text-emerald-400 font-medium">
                Estructura lista para Android y repositorio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-4 space-y-4 pr-1 text-xs text-slate-300">
          {/* Method 1: Direct Android Install (WebAPK) */}
          <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2 text-emerald-400 font-black text-sm">
              <Sparkles className="w-4 h-4" />
              <span>1. Instalación Directa en Celular (APK Web)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Esta app ya incluye <strong className="text-white">Web App Manifest</strong> y{' '}
              <strong className="text-white">Service Worker</strong> para funcionar 100% como una
              APK nativa sin conexión:
            </p>

            <ul className="list-disc list-inside mt-2 space-y-1 text-slate-400">
              <li>Funciona en pantalla completa (sin barra del navegador).</li>
              <li>Ícono directo en la pantalla de inicio de tu teléfono.</li>
              <li>No requiere conexión para guardar o calcular datos.</li>
            </ul>

            {isInstallable ? (
              <button
                onClick={install}
                className="mt-3 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition"
              >
                <Smartphone className="w-4 h-4" />
                Instalar APK en este dispositivo
              </button>
            ) : isInstalled ? (
              <div className="mt-3 p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Ya está instalada como aplicación en este dispositivo
              </div>
            ) : (
              <div className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 leading-relaxed">
                <strong className="text-white block mb-1">En Google Chrome para Android:</strong>
                Toca los 3 puntos (⋮) en la esquina superior derecha y selecciona{' '}
                <strong className="text-emerald-400">"Instalar aplicación"</strong> o{' '}
                <strong className="text-emerald-400">"Agregar a la pantalla principal"</strong>.
              </div>
            )}
          </div>

          {/* Method 2: Convert to Standalone Android APK (.apk / .aab) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2 text-cyan-400 font-black text-sm">
              <Layers className="w-4 h-4" />
              <span>2. Generar archivo .APK para compartir o subir a Play Store</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Para generar el paquete descargable <code className="text-cyan-300">.apk</code>:
            </p>

            <ol className="list-decimal list-inside mt-2 space-y-1.5 text-slate-300">
              <li>
                Entra en{' '}
                <a
                  href="https://www.pwabuilder.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline font-bold inline-flex items-center gap-0.5"
                >
                  PWABuilder.com <ExternalLink className="w-3 h-3" />
                </a>{' '}
                (herramienta oficial de Microsoft & Google).
              </li>
              <li>Pega la URL de tu app desplegada.</li>
              <li>
                Haz clic en <strong className="text-white">"Package for Stores" → "Android"</strong>.
              </li>
              <li>
                ¡Descarga tu archivo <strong className="text-emerald-400">.apk</strong> o{' '}
                <strong className="text-emerald-400">.aab</strong> listo para instalar en cualquier
                teléfono!
              </li>
            </ol>
          </div>

          {/* Method 3: Upload to GitHub */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-white font-black text-sm">
                <Github className="w-4 h-4" />
                <span>3. Subir el código a GitHub</span>
              </div>
              <button
                onClick={() => copyToClipboard(gitCommands, 'git')}
                className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg"
              >
                {copiedSection === 'git' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Comandos
                  </>
                )}
              </button>
            </div>

            <p className="text-slate-400 mb-2">
              El proyecto tiene una estructura estándar de Vite + React + TypeScript lista para GitHub:
            </p>

            <pre className="p-3 bg-slate-900 rounded-xl font-mono text-[11px] text-slate-200 overflow-x-auto border border-slate-800 leading-tight">
              {gitCommands}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
