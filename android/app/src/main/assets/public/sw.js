/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "d62b0edff733de05842cc45bb8b41980"
  }, {
    "url": "pwa-512x512.png",
    "revision": "136b40666520c3592d68b18e1862d574"
  }, {
    "url": "pwa-192x192.png",
    "revision": "12cb3aecd76d514bf912a99025c55d94"
  }, {
    "url": "index.html",
    "revision": "244eb8cc0c67e3e1c962ba68c8565087"
  }, {
    "url": "icon.svg",
    "revision": "5ede8017bd6d52bba01f89df8a3bd65f"
  }, {
    "url": "icon-transparent.png",
    "revision": "136b40666520c3592d68b18e1862d574"
  }, {
    "url": "favicon.ico",
    "revision": "b681baf01011c7c7a853b1cf12a15c0c"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "d68366d492a8b71fff01f2fb2fa1d693"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/purify.es-Dqk5qvad.js",
    "revision": null
  }, {
    "url": "assets/index.es-CHDm9IwP.js",
    "revision": null
  }, {
    "url": "assets/index-M8DwCnlS.css",
    "revision": null
  }, {
    "url": "assets/index-CeKXLWbc.js",
    "revision": null
  }, {
    "url": "assets/html2canvas-D4iuw1Il.js",
    "revision": null
  }, {
    "url": "assets/aistudio/IMG_20261024_130248_e_c3c30a7c.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "d68366d492a8b71fff01f2fb2fa1d693"
  }, {
    "url": "favicon.ico",
    "revision": "b681baf01011c7c7a853b1cf12a15c0c"
  }, {
    "url": "icon.svg",
    "revision": "5ede8017bd6d52bba01f89df8a3bd65f"
  }, {
    "url": "pwa-192x192.png",
    "revision": "12cb3aecd76d514bf912a99025c55d94"
  }, {
    "url": "pwa-512x512.png",
    "revision": "136b40666520c3592d68b18e1862d574"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "d62b0edff733de05842cc45bb8b41980"
  }, {
    "url": "manifest.webmanifest",
    "revision": "f7673345d549a28e7ee9c4162dff12d5"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
