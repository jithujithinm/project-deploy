/* globals __webpack_hash__ */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _interop_require_default = require("@swc/helpers/_/_interop_require_default");
const _fouc = require("./fouc");
const _ondemandentriesclient = /*#__PURE__*/ _interop_require_default._(require("./on-demand-entries-client"));
const _websocket = require("./error-overlay/websocket");
const data = JSON.parse(document.getElementById("__NEXT_DATA__").textContent);
window.__NEXT_DATA__ = data;
let { assetPrefix , page  } = data;
assetPrefix = assetPrefix || "";
let mostRecentHash = null;
/* eslint-disable-next-line */ let curHash = __webpack_hash__;
const hotUpdatePath = assetPrefix + (assetPrefix.endsWith("/") ? "" : "/") + "_next/static/webpack/";
// Is there a newer version of this code available?
function isUpdateAvailable() {
    // __webpack_hash__ is the hash of the current compilation.
    // It's a global variable injected by Webpack.
    /* eslint-disable-next-line */ return mostRecentHash !== __webpack_hash__;
}
// Webpack disallows updates in other states.
function canApplyUpdates() {
    // @ts-expect-error TODO: module.hot exists but type needs to be added. Can't use `as any` here as webpack parses for `module.hot` calls.
    return module.hot.status() === "idle";
}
// This function reads code updates on the fly and hard
// reloads the page when it has changed.
async function tryApplyUpdates() {
    if (!isUpdateAvailable() || !canApplyUpdates()) {
        return;
    }
    try {
        const res = await fetch(typeof __webpack_runtime_id__ !== "undefined" ? "" + hotUpdatePath + curHash + "." + __webpack_runtime_id__ + ".hot-update.json" : "" + hotUpdatePath + curHash + ".hot-update.json");
        const jsonData = await res.json();
        const curPage = page === "/" ? "index" : page;
        // webpack 5 uses an array instead
        const pageUpdated = (Array.isArray(jsonData.c) ? jsonData.c : Object.keys(jsonData.c)).some((mod)=>{
            return mod.indexOf("pages" + (curPage.startsWith("/") ? curPage : "/" + curPage)) !== -1 || mod.indexOf(("pages" + (curPage.startsWith("/") ? curPage : "/" + curPage)).replace(/\//g, "\\")) !== -1;
        });
        if (pageUpdated) {
            window.location.reload();
        } else {
            curHash = mostRecentHash;
        }
    } catch (err) {
        console.error("Error occurred checking for update", err);
        window.location.reload();
    }
}
(0, _websocket.addMessageListener)((event)=>{
    if (event.data === "\uD83D\uDC93") {
        return;
    }
    try {
        const message = JSON.parse(event.data);
        // actions which are not related to amp-dev
        if (message.action === "serverError" || message.action === "devPagesManifestUpdate") return;
        if (message.action === "sync" || message.action === "built") {
            if (!message.hash) {
                return;
            }
            mostRecentHash = message.hash;
            tryApplyUpdates();
        } else if (message.action === "reloadPage") {
            window.location.reload();
        }
    } catch (err) {
        var _err_stack;
        console.warn("[HMR] Invalid message: " + event.data + "\n" + ((_err_stack = err == null ? void 0 : err.stack) != null ? _err_stack : ""));
    }
});
(0, _websocket.connectHMR)({
    assetPrefix,
    path: "/_next/webpack-hmr"
});
(0, _fouc.displayContent)();
(0, _ondemandentriesclient.default)(data.page);

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=amp-dev.js.map