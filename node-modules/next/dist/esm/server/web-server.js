import { byteLength } from "./api-utils/web";
import BaseServer, { NoFallbackError } from "./base-server";
import { generateETag } from "./lib/etag";
import { addRequestMeta } from "./request-meta";
import WebResponseCache from "./response-cache/web";
import { isAPIRoute } from "../lib/is-api-route";
import { getPathMatch } from "../shared/lib/router/utils/path-match";
import getRouteFromAssetPath from "../shared/lib/router/utils/get-route-from-asset-path";
import { normalizeLocalePath } from "../shared/lib/i18n/normalize-locale-path";
import { removeTrailingSlash } from "../shared/lib/router/utils/remove-trailing-slash";
import { isDynamicRoute } from "../shared/lib/router/utils";
import { interpolateDynamicPath, normalizeVercelUrl } from "./server-utils";
import { getNamedRouteRegex } from "../shared/lib/router/utils/route-regex";
import { IncrementalCache } from "./lib/incremental-cache";
export default class NextWebServer extends BaseServer {
    constructor(options){
        super(options);
        // Extend `renderOpts`.
        Object.assign(this.renderOpts, options.webServerConfig.extendRenderOpts);
    }
    handleCompression() {
    // For the web server layer, compression is automatically handled by the
    // upstream proxy (edge runtime or node server) and we can simply skip here.
    }
    getIncrementalCache({ requestHeaders  }) {
        const dev = !!this.renderOpts.dev;
        // incremental-cache is request specific with a shared
        // although can have shared caches in module scope
        // per-cache handler
        return new IncrementalCache({
            dev,
            requestHeaders,
            requestProtocol: "https",
            appDir: this.hasAppDir,
            allowedRevalidateHeaderKeys: this.nextConfig.experimental.allowedRevalidateHeaderKeys,
            minimalMode: this.minimalMode,
            fetchCache: this.nextConfig.experimental.appDir,
            fetchCacheKeyPrefix: this.nextConfig.experimental.fetchCacheKeyPrefix,
            maxMemoryCacheSize: this.nextConfig.experimental.isrMemoryCacheSize,
            flushToDisk: false,
            CurCacheHandler: this.serverOptions.webServerConfig.incrementalCacheHandler,
            getPrerenderManifest: ()=>this.getPrerenderManifest()
        });
    }
    getResponseCache() {
        return new WebResponseCache(this.minimalMode);
    }
    getCustomRoutes() {
        return {
            headers: [],
            rewrites: {
                fallback: [],
                afterFiles: [],
                beforeFiles: []
            },
            redirects: []
        };
    }
    async run(req, res, parsedUrl) {
        super.run(req, res, parsedUrl);
    }
    async hasPage(page) {
        return page === this.serverOptions.webServerConfig.page;
    }
    getPublicDir() {
        // Public files are not handled by the web server.
        return "";
    }
    getBuildId() {
        return this.serverOptions.webServerConfig.extendRenderOpts.buildId;
    }
    loadEnvConfig() {
    // The web server does not need to load the env config. This is done by the
    // runtime already.
    }
    getHasAppDir() {
        return this.serverOptions.webServerConfig.pagesType === "app";
    }
    getHasStaticDir() {
        return false;
    }
    async getFallback() {
        return "";
    }
    getFontManifest() {
        return undefined;
    }
    getPagesManifest() {
        return {
            // keep same theme but server path doesn't need to be accurate
            [this.serverOptions.webServerConfig.normalizedPage]: `server${this.serverOptions.webServerConfig.page}.js`
        };
    }
    getAppPathsManifest() {
        const page = this.serverOptions.webServerConfig.page;
        return {
            [this.serverOptions.webServerConfig.page]: `app${page}.js`
        };
    }
    getFilesystemPaths() {
        return new Set();
    }
    attachRequestMeta(req, parsedUrl) {
        addRequestMeta(req, "__NEXT_INIT_QUERY", {
            ...parsedUrl.query
        });
    }
    getPrerenderManifest() {
        var _this_renderOpts;
        const { prerenderManifest  } = this.serverOptions.webServerConfig;
        if (((_this_renderOpts = this.renderOpts) == null ? void 0 : _this_renderOpts.dev) || !prerenderManifest) {
            return {
                version: -1,
                routes: {},
                dynamicRoutes: {},
                notFoundRoutes: [],
                preview: {
                    previewModeId: "development-id"
                }
            };
        }
        return prerenderManifest;
    }
    getNextFontManifest() {
        return this.serverOptions.webServerConfig.extendRenderOpts.nextFontManifest;
    }
    generateRoutes() {
        const fsRoutes = [
            {
                match: getPathMatch("/_next/data/:path*"),
                type: "route",
                name: "_next/data catchall",
                check: true,
                fn: async (req, res, params, _parsedUrl)=>{
                    // Make sure to 404 for /_next/data/ itself and
                    // we also want to 404 if the buildId isn't correct
                    if (!params.path || params.path[0] !== this.buildId) {
                        await this.render404(req, res, _parsedUrl);
                        return {
                            finished: true
                        };
                    }
                    // remove buildId from URL
                    params.path.shift();
                    const lastParam = params.path[params.path.length - 1];
                    // show 404 if it doesn't end with .json
                    if (typeof lastParam !== "string" || !lastParam.endsWith(".json")) {
                        await this.render404(req, res, _parsedUrl);
                        return {
                            finished: true
                        };
                    }
                    // re-create page's pathname
                    let pathname = `/${params.path.join("/")}`;
                    pathname = getRouteFromAssetPath(pathname, ".json");
                    // ensure trailing slash is normalized per config
                    if (this.router.hasMiddleware) {
                        if (this.nextConfig.trailingSlash && !pathname.endsWith("/")) {
                            pathname += "/";
                        }
                        if (!this.nextConfig.trailingSlash && pathname.length > 1 && pathname.endsWith("/")) {
                            pathname = pathname.substring(0, pathname.length - 1);
                        }
                    }
                    if (this.nextConfig.i18n) {
                        var _this_i18nProvider;
                        const { host  } = (req == null ? void 0 : req.headers) || {};
                        // remove port from host and remove port if present
                        const hostname = host == null ? void 0 : host.split(":")[0].toLowerCase();
                        const localePathResult = normalizeLocalePath(pathname, this.nextConfig.i18n.locales);
                        const domainLocale = (_this_i18nProvider = this.i18nProvider) == null ? void 0 : _this_i18nProvider.detectDomainLocale(hostname);
                        let detectedLocale = "";
                        if (localePathResult.detectedLocale) {
                            pathname = localePathResult.pathname;
                            detectedLocale = localePathResult.detectedLocale;
                        }
                        _parsedUrl.query.__nextLocale = detectedLocale;
                        _parsedUrl.query.__nextDefaultLocale = (domainLocale == null ? void 0 : domainLocale.defaultLocale) || this.nextConfig.i18n.defaultLocale;
                        if (!detectedLocale && !this.router.hasMiddleware) {
                            _parsedUrl.query.__nextLocale = _parsedUrl.query.__nextDefaultLocale;
                            await this.render404(req, res, _parsedUrl);
                            return {
                                finished: true
                            };
                        }
                    }
                    return {
                        pathname,
                        query: {
                            ..._parsedUrl.query,
                            __nextDataReq: "1"
                        },
                        finished: false
                    };
                }
            },
            {
                match: getPathMatch("/_next/:path*"),
                type: "route",
                name: "_next catchall",
                // This path is needed because `render()` does a check for `/_next` and the calls the routing again
                fn: async (req, res, _params, parsedUrl)=>{
                    await this.render404(req, res, parsedUrl);
                    return {
                        finished: true
                    };
                }
            }
        ];
        const catchAllRoute = {
            match: getPathMatch("/:path*"),
            type: "route",
            matchesLocale: true,
            name: "Catchall render",
            fn: async (req, res, _params, parsedUrl)=>{
                let { pathname , query  } = parsedUrl;
                if (!pathname) {
                    throw new Error("pathname is undefined");
                }
                // interpolate query information into page for dynamic route
                // so that rewritten paths are handled properly
                const normalizedPage = this.serverOptions.webServerConfig.normalizedPage;
                if (pathname !== normalizedPage) {
                    pathname = normalizedPage;
                    if (isDynamicRoute(pathname)) {
                        const routeRegex = getNamedRouteRegex(pathname, false);
                        pathname = interpolateDynamicPath(pathname, query, routeRegex);
                        normalizeVercelUrl(req, true, Object.keys(routeRegex.routeKeys), true, routeRegex);
                    }
                }
                // next.js core assumes page path without trailing slash
                pathname = removeTrailingSlash(pathname);
                if (this.i18nProvider) {
                    const { detectedLocale  } = await this.i18nProvider.analyze(pathname);
                    if (detectedLocale) {
                        parsedUrl.query.__nextLocale = detectedLocale;
                    }
                }
                const bubbleNoFallback = !!query._nextBubbleNoFallback;
                if (isAPIRoute(pathname)) {
                    delete query._nextBubbleNoFallback;
                }
                try {
                    await this.render(req, res, pathname, query, parsedUrl, true);
                    return {
                        finished: true
                    };
                } catch (err) {
                    if (err instanceof NoFallbackError && bubbleNoFallback) {
                        return {
                            finished: false
                        };
                    }
                    throw err;
                }
            }
        };
        const { useFileSystemPublicRoutes  } = this.nextConfig;
        if (useFileSystemPublicRoutes) {
            this.appPathRoutes = this.getAppPathRoutes();
        }
        return {
            headers: [],
            fsRoutes,
            rewrites: {
                beforeFiles: [],
                afterFiles: [],
                fallback: []
            },
            redirects: [],
            catchAllRoute,
            catchAllMiddleware: [],
            useFileSystemPublicRoutes,
            matchers: this.matchers,
            nextConfig: this.nextConfig
        };
    }
    // Edge API requests are handled separately in minimal mode.
    async handleApiRequest() {
        return false;
    }
    renderHTML(req, res, pathname, query, renderOpts) {
        const { renderToHTML  } = this.serverOptions.webServerConfig;
        if (!renderToHTML) {
            throw new Error("Invariant: routeModule should be configured when rendering pages");
        }
        return renderToHTML(req, res, pathname, query, Object.assign(renderOpts, {
            disableOptimizedLoading: true,
            runtime: "experimental-edge"
        }));
    }
    async sendRenderResult(_req, res, options) {
        res.setHeader("X-Edge-Runtime", "1");
        // Add necessary headers.
        // @TODO: Share the isomorphic logic with server/send-payload.ts.
        if (options.poweredByHeader && options.type === "html") {
            res.setHeader("X-Powered-By", "Next.js");
        }
        if (!res.getHeader("Content-Type")) {
            res.setHeader("Content-Type", options.result.contentType ? options.result.contentType : options.type === "json" ? "application/json" : "text/html; charset=utf-8");
        }
        if (options.result.isDynamic) {
            const writer = res.transformStream.writable.getWriter();
            options.result.pipe({
                write: (chunk)=>writer.write(chunk),
                end: ()=>writer.close(),
                destroy: (err)=>writer.abort(err),
                cork: ()=>{},
                uncork: ()=>{}
            });
        } else {
            const payload = await options.result.toUnchunkedString();
            res.setHeader("Content-Length", String(byteLength(payload)));
            if (options.generateEtags) {
                res.setHeader("ETag", generateETag(payload));
            }
            res.body(payload);
        }
        res.send();
    }
    async runApi() {
        // @TODO
        return true;
    }
    async findPageComponents({ pathname , query , params  }) {
        const result = await this.serverOptions.webServerConfig.loadComponent(pathname);
        if (!result) return null;
        return {
            query: {
                ...query || {},
                ...params || {}
            },
            components: result
        };
    }
}

//# sourceMappingURL=web-server.js.map