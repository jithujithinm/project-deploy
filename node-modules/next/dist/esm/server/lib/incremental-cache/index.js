import FileSystemCache from "./file-system-cache";
import path from "../../../shared/lib/isomorphic/path";
import { normalizePagePath } from "../../../shared/lib/page-path/normalize-page-path";
import FetchCache from "./fetch-cache";
import { encode } from "../../../shared/lib/base64-arraybuffer";
import { encodeText } from "../../stream-utils/encode-decode";
import { CACHE_ONE_YEAR, PRERENDER_REVALIDATE_HEADER } from "../../../lib/constants";
function toRoute(pathname) {
    return pathname.replace(/\/$/, "").replace(/\/index$/, "") || "/";
}
export class CacheHandler {
    // eslint-disable-next-line
    constructor(_ctx){}
    async get(_key, _fetchCache, _fetchUrl, _fetchIdx) {
        return {};
    }
    async set(_key, _data, _fetchCache, _fetchUrl, _fetchIdx) {}
    async revalidateTag(_tag) {}
}
export class IncrementalCache {
    constructor({ fs , dev , appDir , flushToDisk , fetchCache , minimalMode , serverDistDir , requestHeaders , requestProtocol , maxMemoryCacheSize , getPrerenderManifest , fetchCacheKeyPrefix , CurCacheHandler , allowedRevalidateHeaderKeys  }){
        var _this_prerenderManifest, _this_prerenderManifest_preview, _this_prerenderManifest1, _this_prerenderManifest_preview1;
        const debug = !!process.env.NEXT_PRIVATE_DEBUG_CACHE;
        if (!CurCacheHandler) {
            if (fs && serverDistDir) {
                if (debug) {
                    console.log("using filesystem cache handler");
                }
                CurCacheHandler = FileSystemCache;
            }
            if (FetchCache.isAvailable({
                _requestHeaders: requestHeaders
            }) && minimalMode && fetchCache) {
                if (debug) {
                    console.log("using fetch cache handler");
                }
                CurCacheHandler = FetchCache;
            }
        } else if (debug) {
            console.log("using custom cache handler", CurCacheHandler.name);
        }
        if (process.env.__NEXT_TEST_MAX_ISR_CACHE) {
            // Allow cache size to be overridden for testing purposes
            maxMemoryCacheSize = parseInt(process.env.__NEXT_TEST_MAX_ISR_CACHE, 10);
        }
        this.dev = dev;
        this.minimalMode = minimalMode;
        this.requestHeaders = requestHeaders;
        this.requestProtocol = requestProtocol;
        this.allowedRevalidateHeaderKeys = allowedRevalidateHeaderKeys;
        this.prerenderManifest = getPrerenderManifest();
        this.fetchCacheKeyPrefix = fetchCacheKeyPrefix;
        let revalidatedTags = [];
        if (requestHeaders[PRERENDER_REVALIDATE_HEADER] === ((_this_prerenderManifest = this.prerenderManifest) == null ? void 0 : (_this_prerenderManifest_preview = _this_prerenderManifest.preview) == null ? void 0 : _this_prerenderManifest_preview.previewModeId)) {
            this.isOnDemandRevalidate = true;
        }
        if (minimalMode && typeof requestHeaders["x-next-revalidated-tags"] === "string" && requestHeaders["x-next-revalidate-tag-token"] === ((_this_prerenderManifest1 = this.prerenderManifest) == null ? void 0 : (_this_prerenderManifest_preview1 = _this_prerenderManifest1.preview) == null ? void 0 : _this_prerenderManifest_preview1.previewModeId)) {
            revalidatedTags = requestHeaders["x-next-revalidated-tags"].split(",");
        }
        if (CurCacheHandler) {
            this.cacheHandler = new CurCacheHandler({
                dev,
                fs,
                flushToDisk,
                serverDistDir,
                revalidatedTags,
                maxMemoryCacheSize,
                _appDir: !!appDir,
                _requestHeaders: requestHeaders,
                fetchCacheKeyPrefix
            });
        }
    }
    calculateRevalidate(pathname, fromTime, dev) {
        // in development we don't have a prerender-manifest
        // and default to always revalidating to allow easier debugging
        if (dev) return new Date().getTime() - 1000;
        // if an entry isn't present in routes we fallback to a default
        // of revalidating after 1 second
        const { initialRevalidateSeconds  } = this.prerenderManifest.routes[toRoute(pathname)] || {
            initialRevalidateSeconds: 1
        };
        const revalidateAfter = typeof initialRevalidateSeconds === "number" ? initialRevalidateSeconds * 1000 + fromTime : initialRevalidateSeconds;
        return revalidateAfter;
    }
    _getPathname(pathname, fetchCache) {
        return fetchCache ? pathname : normalizePagePath(pathname);
    }
    async revalidateTag(tag) {
        var _this_cacheHandler;
        return (_this_cacheHandler = this.cacheHandler) == null ? void 0 : _this_cacheHandler.revalidateTag == null ? void 0 : _this_cacheHandler.revalidateTag(tag);
    }
    // x-ref: https://github.com/facebook/react/blob/2655c9354d8e1c54ba888444220f63e836925caa/packages/react/src/ReactFetch.js#L23
    async fetchCacheKey(url, init = {}) {
        // this should be bumped anytime a fix is made to cache entries
        // that should bust the cache
        const MAIN_KEY_PREFIX = "v3";
        let cacheKey;
        const bodyChunks = [];
        if (init.body) {
            // handle ReadableStream body
            if (typeof init.body.getReader === "function") {
                const readableBody = init.body;
                const reader = readableBody.getReader();
                let arrayBuffer = new Uint8Array();
                function processValue({ done , value  }) {
                    if (done) {
                        return;
                    }
                    if (value) {
                        try {
                            bodyChunks.push(typeof value === "string" ? value : encode(value));
                            const curBuffer = typeof value === "string" ? encodeText(value) : new Uint8Array(value);
                            const prevBuffer = arrayBuffer;
                            arrayBuffer = new Uint8Array(prevBuffer.byteLength + curBuffer.byteLength);
                            arrayBuffer.set(prevBuffer);
                            arrayBuffer.set(curBuffer, prevBuffer.byteLength);
                        } catch (err) {
                            console.error(err);
                        }
                    }
                    reader.read().then(processValue);
                }
                await reader.read().then(processValue);
                init._ogBody = arrayBuffer;
            } else if (typeof init.body.keys === "function") {
                const formData = init.body;
                init._ogBody = init.body;
                for (const key of new Set([
                    ...formData.keys()
                ])){
                    const values = formData.getAll(key);
                    bodyChunks.push(`${key}=${(await Promise.all(values.map(async (val)=>{
                        if (typeof val === "string") {
                            return val;
                        } else {
                            return await val.text();
                        }
                    }))).join(",")}`);
                }
            // handle blob body
            } else if (typeof init.body.arrayBuffer === "function") {
                const blob = init.body;
                const arrayBuffer = await blob.arrayBuffer();
                bodyChunks.push(encode(await init.body.arrayBuffer()));
                init._ogBody = new Blob([
                    arrayBuffer
                ], {
                    type: blob.type
                });
            } else if (typeof init.body === "string") {
                bodyChunks.push(init.body);
                init._ogBody = init.body;
            }
        }
        const cacheString = JSON.stringify([
            MAIN_KEY_PREFIX,
            this.fetchCacheKeyPrefix || "",
            url,
            init.method,
            typeof (init.headers || {}).keys === "function" ? Object.fromEntries(init.headers) : init.headers,
            init.mode,
            init.redirect,
            init.credentials,
            init.referrer,
            init.referrerPolicy,
            init.integrity,
            init.cache,
            bodyChunks
        ]);
        if (process.env.NEXT_RUNTIME === "edge") {
            function bufferToHex(buffer) {
                return Array.prototype.map.call(new Uint8Array(buffer), (b)=>b.toString(16).padStart(2, "0")).join("");
            }
            const buffer = encodeText(cacheString);
            cacheKey = bufferToHex(await crypto.subtle.digest("SHA-256", buffer));
        } else {
            const crypto1 = require("crypto");
            cacheKey = crypto1.createHash("sha256").update(cacheString).digest("hex");
        }
        return cacheKey;
    }
    // get data from cache if available
    async get(pathname, fetchCache, revalidate, fetchUrl, fetchIdx) {
        var _this_cacheHandler, _cacheData_value, _this_prerenderManifest_routes_toRoute;
        // we don't leverage the prerender cache in dev mode
        // so that getStaticProps is always called for easier debugging
        if (this.dev && (!fetchCache || this.requestHeaders["cache-control"] === "no-cache")) {
            return null;
        }
        pathname = this._getPathname(pathname, fetchCache);
        let entry = null;
        const cacheData = await ((_this_cacheHandler = this.cacheHandler) == null ? void 0 : _this_cacheHandler.get(pathname, fetchCache, fetchUrl, fetchIdx));
        if ((cacheData == null ? void 0 : (_cacheData_value = cacheData.value) == null ? void 0 : _cacheData_value.kind) === "FETCH") {
            revalidate = revalidate || cacheData.value.revalidate;
            const age = Math.round((Date.now() - (cacheData.lastModified || 0)) / 1000);
            const isStale = age > revalidate;
            const data = cacheData.value.data;
            return {
                isStale: isStale,
                value: {
                    kind: "FETCH",
                    data,
                    revalidate: revalidate
                },
                revalidateAfter: Date.now() + revalidate * 1000
            };
        }
        const curRevalidate = (_this_prerenderManifest_routes_toRoute = this.prerenderManifest.routes[toRoute(pathname)]) == null ? void 0 : _this_prerenderManifest_routes_toRoute.initialRevalidateSeconds;
        let isStale;
        let revalidateAfter;
        if ((cacheData == null ? void 0 : cacheData.lastModified) === -1) {
            isStale = -1;
            revalidateAfter = -1 * CACHE_ONE_YEAR;
        } else {
            revalidateAfter = this.calculateRevalidate(pathname, (cacheData == null ? void 0 : cacheData.lastModified) || Date.now(), this.dev && !fetchCache);
            isStale = revalidateAfter !== false && revalidateAfter < Date.now() ? true : undefined;
        }
        if (cacheData) {
            entry = {
                isStale,
                curRevalidate,
                revalidateAfter,
                value: cacheData.value
            };
        }
        if (!cacheData && this.prerenderManifest.notFoundRoutes.includes(pathname)) {
            // for the first hit after starting the server the cache
            // may not have a way to save notFound: true so if
            // the prerender-manifest marks this as notFound then we
            // return that entry and trigger a cache set to give it a
            // chance to update in-memory entries
            entry = {
                isStale,
                value: null,
                curRevalidate,
                revalidateAfter
            };
            this.set(pathname, entry.value, curRevalidate, fetchCache, fetchUrl, fetchIdx);
        }
        return entry;
    }
    // populate the incremental cache with new data
    async set(pathname, data, revalidateSeconds, fetchCache, fetchUrl, fetchIdx) {
        if (this.dev && !fetchCache) return;
        // fetchCache has upper limit of 2MB per-entry currently
        if (fetchCache && JSON.stringify(data).length > 2 * 1024 * 1024) {
            if (this.dev) {
                throw new Error(`fetch for over 2MB of data can not be cached`);
            }
            return;
        }
        pathname = this._getPathname(pathname, fetchCache);
        try {
            var _this_cacheHandler;
            // we use the prerender manifest memory instance
            // to store revalidate timings for calculating
            // revalidateAfter values so we update this on set
            if (typeof revalidateSeconds !== "undefined" && !fetchCache) {
                this.prerenderManifest.routes[pathname] = {
                    dataRoute: path.posix.join("/_next/data", `${normalizePagePath(pathname)}.json`),
                    srcRoute: null,
                    initialRevalidateSeconds: revalidateSeconds
                };
            }
            await ((_this_cacheHandler = this.cacheHandler) == null ? void 0 : _this_cacheHandler.set(pathname, data, fetchCache, fetchUrl, fetchIdx));
        } catch (error) {
            console.warn("Failed to update prerender cache for", pathname, error);
        }
    }
}

//# sourceMappingURL=index.js.map