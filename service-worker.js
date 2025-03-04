// https://developers.google.com/web/fundamentals/primers/service-workers/
// chrome: chrome://inspect/#service-workers

var CACHE_NAME = 'v1';
var urlsToCache = [
  './',
  './index.html',
  // css
  './css/style.css',
  // js
  './src/applauncher.js',
  './src/appgui.js',
  './src/dropbox.js',
  './src/google.js',
  './src/register-sw.js',
  './src/gui/custom.js',
  './src/gui/dropboxLoader.js',
  './src/gui/filter.js',
  './src/gui/generic.js',
  './src/gui/help.js',
  './src/gui/html.js',
  './src/gui/infoController.js',
  './src/gui/infoOverlay.js',
  './src/gui/loader.js',
  './src/gui/tools.js',
  './src/gui/undo.js',
  './src/utils/browser.js',
  './src/utils/modernizr.js',
  // images
  './resources/icons/icon-16.png',
  './resources/icons/icon-32.png',
  './resources/icons/icon-64.png',
  './resources/icons/icon-128.png',
  './resources/icons/icon-256.png',
  './resources/help/double_tap.png',
  './resources/help/tap_and_hold.png',
  './resources/help/tap.png',
  './resources/help/touch_drag.png',
  './resources/help/twotouch_drag.png',
  './resources/help/twotouch_pinch.png',
  // translations
  './resources/locales/de/translation.json',
  './resources/locales/en/translation.json',
  './resources/locales/es/translation.json',
  './resources/locales/fr/translation.json',
  './resources/locales/it/translation.json',
  './resources/locales/jp/translation.json',
  './resources/locales/ru/translation.json',
  './resources/locales/zh/translation.json',
  // overlays
  './resources/locales/de/overlays.json',
  './resources/locales/en/overlays.json',
  './resources/locales/es/overlays.json',
  './resources/locales/fr/overlays.json',
  './resources/locales/it/overlays.json',
  './resources/locales/jp/overlays.json',
  './resources/locales/ru/overlays.json',
  './resources/locales/zh/overlays.json',

  // third party

  // css
  './ext/jquery-mobile/jquery.mobile-1.4.5.min.css',
  './ext/jquery-mobile/images/ajax-loader.gif',
  './ext/jquery-mobile/images/icons-svg/plus-white.svg',
  './ext/jquery-mobile/images/icons-svg/forward-white.svg',
  './ext/jquery-mobile/images/icons-svg/back-white.svg',
  './ext/jquery-mobile/images/icons-svg/info-white.svg',
  './ext/jquery-mobile/images/icons-svg/grid-black.svg',
  './ext/jquery-mobile/images/icons-png/plus-white.png',
  './ext/jquery-mobile/images/icons-png/forward-white.png',
  './ext/jquery-mobile/images/icons-png/back-white.png',
  './ext/jquery-mobile/images/icons-png/info-white.png',
  './ext/jquery-mobile/images/icons-png/grid-black.png',
  // js: dwv
  './node_modules/dwv/dist/dwv.min.js',
  './node_modules/jszip/dist/jszip.min.js',
  './node_modules/konva/konva.min.js',
  './node_modules/magic-wand-tool/dist/magic-wand.min.js',
  // js: viewer
  './node_modules/jquery/dist/jquery.min.js',
  './ext/jquery-mobile/jquery.mobile-1.4.5.min.js',
  './ext/jquery-mobile/jquery.mobile-1.4.5.min.map',
  './node_modules/nprogress/nprogress.js',
  './ext/flot/jquery.flot.min.js',
  './node_modules/i18next/i18next.min.js',
  './node_modules/i18next-http-backend/i18nextHttpBackend.min.js',
  './node_modules/i18next-browser-languagedetector/' +
    'i18nextBrowserLanguageDetector.min.js',
  './ext/dropbox-dropins/dropins.js',
  './ext/google-api-javascript-client/client.js',
  './ext/google-api-javascript-client/api.js',
  // js: decoders
  './node_modules/dwv/decoders/dwv/rle.js',
  './node_modules/dwv/decoders/dwv/decode-rle.js',
  './node_modules/dwv/decoders/pdfjs/jpx.js',
  './node_modules/dwv/decoders/pdfjs/arithmetic_decoder.js',
  './node_modules/dwv/decoders/pdfjs/decode-jpeg2000.js',
  './node_modules/dwv/decoders/pdfjs/util.js',
  './node_modules/dwv/decoders/pdfjs/jpg.js',
  './node_modules/dwv/decoders/pdfjs/decode-jpegbaseline.js',
  './node_modules/dwv/decoders/rii-mango/lossless-min.js',
  './node_modules/dwv/decoders/rii-mango/decode-jpegloss.js'
];

// install
self.addEventListener('install', event => {
  self.skipWaiting();
});

// fetch
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        var responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then(function(cache) {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(function() {
        // Network request failed, try to serve from cache
        return caches.match(event.request);
      })
  );
});


// activate
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// In your main JavaScript file
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then(registration => {
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      installingWorker.onstatechange = () => {
        if (
          installingWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          // New update available
          alert('New version available! Refresh the page.');
        }
      };
    };
  });
}
