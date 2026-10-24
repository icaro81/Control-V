export const APP_VERSION = '1.1.0';
export const APP_BUILD_TIME = 1730000000000;
export const VERSION_STORAGE_KEY = 'CONTROL_DIARIO_APP_VERSION';

export interface RemoteVersionInfo {
  version: string;
  buildTime: number;
  releaseDate?: string;
  title?: string;
  notes?: string;
}

/**
 * Checks remote version against current running bundle version.
 */
export async function checkForRemoteUpdate(): Promise<{ hasUpdate: boolean; remoteInfo: RemoteVersionInfo | null }> {
  try {
    const res = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (!res.ok) {
      return { hasUpdate: false, remoteInfo: null };
    }

    const data: RemoteVersionInfo = await res.json();
    if (!data || !data.version) {
      return { hasUpdate: false, remoteInfo: null };
    }

    const storedDismissedVersion = localStorage.getItem(`${VERSION_STORAGE_KEY}_DISMISSED`);

    // If version is strictly different from current and not dismissed
    const isNewer = Boolean(data.version !== APP_VERSION || (typeof data.buildTime === 'number' && data.buildTime > APP_BUILD_TIME));
    const wasDismissed = storedDismissedVersion === data.version;

    return {
      hasUpdate: Boolean(isNewer && !wasDismissed),
      remoteInfo: data,
    };
  } catch {
    return { hasUpdate: false, remoteInfo: null };
  }
}
