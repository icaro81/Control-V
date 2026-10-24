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
define(['./workbox-f0c192c2'], (function (workbox) { 'use strict';

  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "9c30bb77a3568b46d5ca67919a4493bd"
  }, {
    "url": "pwa-512x512.png",
    "revision": "9c30bb77a3568b46d5ca67919a4493bd"
  }, {
    "url": "pwa-192x192.png",
    "revision": "d731803d10101c1edf357cc6c4f20bf5"
  }, {
    "url": "index.html",
    "revision": "55da8ffde6c7cb0c783712bf3af49ebc"
  }, {
    "url": "icon.svg",
    "revision": "8191608abf7bb040533d7f3c9f52e7c4"
  }, {
    "url": "favicon.ico",
    "revision": "d731803d10101c1edf357cc6c4f20bf5"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "d731803d10101c1edf357cc6c4f20bf5"
  }, {
    "url": "assets/workbox-window.prod.es5-Bd17z0YL.js",
    "revision": null
  }, {
    "url": "assets/index-D4I9Z7tD.js",
    "revision": null
  }, {
    "url": "assets/index-CIclpqgy.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "d731803d10101c1edf357cc6c4f20bf5"
  }, {
    "url": "favicon.ico",
    "revision": "d731803d10101c1edf357cc6c4f20bf5"
  }, {
    "url": "icon.svg",
    "revision": "8191608abf7bb040533d7f3c9f52e7c4"
  }, {
    "url": "pwa-192x192.png",
    "revision": "d731803d10101c1edf357cc6c4f20bf5"
  }, {
    "url": "pwa-512x512.png",
    "revision": "9c30bb77a3568b46d5ca67919a4493bd"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "9c30bb77a3568b46d5ca67919a4493bd"
  }, {
    "url": "manifest.webmanifest",
    "revision": "f7673345d549a28e7ee9c4162dff12d5"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
