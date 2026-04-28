'use strict';

var _debugEnabled = false;

function isDebugMode() {
  try {
    return window.location.search.indexOf('wbp_debug=true') !== -1;
  } catch (_) {
    return false;
  }
}

function initDebugMode(state, sdk) {
  if (!isDebugMode()) return;
  _debugEnabled = true;

  console.group('[WolfpackBundles SDK] Debug mode active (?wbp_debug=true)');
  console.log('State:', state);
  console.log('SDK:', sdk);
  console.groupEnd();

  var events = [
    'wbp:ready', 'wbp:item-added', 'wbp:item-removed',
    'wbp:step-cleared', 'wbp:cart-success', 'wbp:cart-failed',
  ];
  events.forEach(function (name) {
    window.addEventListener(name, function (e) {
      console.log('[WolfpackBundles] Event:', name, (e as CustomEvent).detail);
    });
  });
}

function debugLog() {
  if (!_debugEnabled) return;
  console.log.apply(console, ['[WolfpackBundles]'].concat(Array.prototype.slice.call(arguments)));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { isDebugMode, initDebugMode, debugLog };
}
