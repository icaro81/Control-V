export const APP_VERSION = '1.1.0';
export const APP_BUILD_TIME = 1793833000000;
export const VERSION_STORAGE_KEY = 'CONTROL_DIARIO_APP_VERSION';
export const GITHUB_REPO = 'icaro81/Control-V';
export const LATEST_APK_URL = `https://github.com/${GITHUB_REPO}/releases/latest/download/Control-Diario-latest.apk`;

export interface RemoteVersionInfo {
  version: string;
  downloadUrl: string;
  releaseDate?: string;
  title?: string;
  notes?: string;
  buildTime?: number;
}

/**
 * Parses a version string like 'v1.1.12' or '1.1.0' into numeric components.
 */
function parseVersion(vStr: string): number[] {
  const clean = vStr.replace(/^[vV]/, '').trim();
  const parts = clean.split(/[.-]/).map((p) => parseInt(p, 10)).filter((n) => !isNaN(n));
  return parts.length > 0 ? parts : [0];
}

/**
 * Returns true if remote version is strictly newer than current local version.
 */
export function isRemoteNewer(remoteVersion: string, localVersion: string): boolean {
  if (!remoteVersion) return false;
  const remoteParts = parseVersion(remoteVersion);
  const localParts = parseVersion(localVersion);

  const maxLen = Math.max(remoteParts.length, localParts.length);
  for (let i = 0; i < maxLen; i++) {
    const r = remoteParts[i] ?? 0;
    const l = localParts[i] ?? 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

/**
 * Checks for updates from GitHub Releases API first, falling back to /version.json.
 */
export async function checkForRemoteUpdate(): Promise<{
  hasUpdate: boolean;
  remoteInfo: RemoteVersionInfo | null;
}> {
  // 1. Try checking GitHub Releases API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const ghRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (ghRes.ok) {
      const data = await ghRes.json();
      if (data && data.tag_name) {
        const remoteVersion = data.tag_name;
        // Find APK download asset or use direct latest release download URL
        const apkAsset = Array.isArray(data.assets)
          ? data.assets.find((a: { name?: string }) => a.name?.endsWith('.apk'))
          : null;

        const downloadUrl = apkAsset?.browser_download_url || LATEST_APK_URL;

        const storedDismissedVersion = localStorage.getItem(`${VERSION_STORAGE_KEY}_DISMISSED`);
        const isNewer = isRemoteNewer(remoteVersion, APP_VERSION);
        const wasDismissed = storedDismissedVersion === remoteVersion;

        const remoteInfo: RemoteVersionInfo = {
          version: remoteVersion,
          downloadUrl,
          releaseDate: data.published_at,
          title: data.name || `Versión ${remoteVersion}`,
          notes: data.body || '',
        };

        if (isNewer && !wasDismissed) {
          return { hasUpdate: true, remoteInfo };
        }
      }
    }
  } catch (err) {
    // Network error or rate-limited on GitHub API - continue to fallback
  }

  // 2. Fallback: check /version.json
  try {
    const res = await fetch(`/version.json?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.version) {
        const isNewer =
          isRemoteNewer(data.version, APP_VERSION) ||
          (typeof data.buildTime === 'number' && data.buildTime > APP_BUILD_TIME);

        const storedDismissedVersion = localStorage.getItem(`${VERSION_STORAGE_KEY}_DISMISSED`);
        const wasDismissed = storedDismissedVersion === data.version;

        if (isNewer && !wasDismissed) {
          return {
            hasUpdate: true,
            remoteInfo: {
              version: data.version,
              downloadUrl: LATEST_APK_URL,
              buildTime: data.buildTime,
              releaseDate: data.releaseDate,
              title: data.title,
              notes: data.notes,
            },
          };
        }
      }
    }
  } catch {
    // offline or static fail
  }

  return { hasUpdate: false, remoteInfo: null };
}
