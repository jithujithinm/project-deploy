import http from "http";
import { isIPv6 } from "net";
import * as Log from "../../build/output/log";
import { normalizeRepeatedSlashes } from "../../shared/lib/utils";
import { initialEnv } from "@next/env";
import { genRouterWorkerExecArgv, getDebugPort, getNodeOptionsWithoutInspect } from "./utils";
export async function startServer({ dir , prevDir , port , isDev , hostname , useWorkers , allowRetry , keepAliveTimeout , onStdout , onStderr  }) {
    var _process_env_NODE_OPTIONS, _process_env_NODE_OPTIONS1;
    const sockets = new Set();
    let worker;
    let handlersReady = ()=>{};
    let handlersError = ()=>{};
    let isNodeDebugging = !!(process.execArgv.some((localArg)=>localArg.startsWith("--inspect")) || ((_process_env_NODE_OPTIONS = process.env.NODE_OPTIONS) == null ? void 0 : _process_env_NODE_OPTIONS.match == null ? void 0 : _process_env_NODE_OPTIONS.match(/--inspect(=\S+)?( |$)/)));
    if (process.execArgv.some((localArg)=>localArg.startsWith("--inspect-brk")) || ((_process_env_NODE_OPTIONS1 = process.env.NODE_OPTIONS) == null ? void 0 : _process_env_NODE_OPTIONS1.match == null ? void 0 : _process_env_NODE_OPTIONS1.match(/--inspect-brk(=\S+)?( |$)/))) {
        isNodeDebugging = "brk";
    }
    let handlersPromise = new Promise((resolve, reject)=>{
        handlersReady = resolve;
        handlersError = reject;
    });
    let requestHandler = async (_req, _res)=>{
        if (handlersPromise) {
            await handlersPromise;
            return requestHandler(_req, _res);
        }
        throw new Error("Invariant request handler was not setup");
    };
    let upgradeHandler = async (_req, _socket, _head)=>{
        if (handlersPromise) {
            await handlersPromise;
            return upgradeHandler(_req, _socket, _head);
        }
        throw new Error("Invariant upgrade handler was not setup");
    };
    // setup server listener as fast as possible
    const server = http.createServer(async (req, res)=>{
        try {
            if (handlersPromise) {
                await handlersPromise;
                handlersPromise = undefined;
            }
            sockets.add(res);
            res.on("close", ()=>sockets.delete(res));
            await requestHandler(req, res);
        } catch (err) {
            res.statusCode = 500;
            res.end("Internal Server Error");
            Log.error(`Failed to handle request for ${req.url}`);
            console.error(err);
        }
    });
    if (keepAliveTimeout) {
        server.keepAliveTimeout = keepAliveTimeout;
    }
    server.on("upgrade", async (req, socket, head)=>{
        try {
            sockets.add(socket);
            socket.on("close", ()=>sockets.delete(socket));
            await upgradeHandler(req, socket, head);
        } catch (err) {
            socket.destroy();
            Log.error(`Failed to handle request for ${req.url}`);
            console.error(err);
        }
    });
    let portRetryCount = 0;
    server.on("error", (err)=>{
        if (allowRetry && port && isDev && err.code === "EADDRINUSE" && portRetryCount < 10) {
            Log.warn(`Port ${port} is in use, trying ${port + 1} instead.`);
            port += 1;
            portRetryCount += 1;
            server.listen(port, hostname);
        } else {
            Log.error(`Failed to start server`);
            console.error(err);
            process.exit(1);
        }
    });
    let targetHost = hostname;
    await new Promise((resolve)=>{
        server.on("listening", ()=>{
            const addr = server.address();
            port = typeof addr === "object" ? (addr == null ? void 0 : addr.port) || port : port;
            let host = !hostname || hostname === "0.0.0.0" ? "localhost" : hostname;
            let normalizedHostname = hostname || "0.0.0.0";
            if (isIPv6(hostname)) {
                host = host === "::" ? "[::1]" : `[${host}]`;
                normalizedHostname = `[${hostname}]`;
            }
            targetHost = host;
            const appUrl = `http://${host}:${port}`;
            if (isNodeDebugging) {
                const debugPort = getDebugPort();
                Log.info(`the --inspect${isNodeDebugging === "brk" ? "-brk" : ""} option was detected, the Next.js proxy server should be inspected at port ${debugPort}.`);
            }
            Log.ready(`started server on ${normalizedHostname}${(port + "").startsWith(":") ? "" : ":"}${port}, url: ${appUrl}`);
            resolve();
        });
        server.listen(port, hostname);
    });
    try {
        if (useWorkers) {
            var _routerWorker__workerPool;
            const httpProxy = require("next/dist/compiled/http-proxy");
            let renderServerPath = require.resolve("./render-server");
            let jestWorkerPath = require.resolve("next/dist/compiled/jest-worker");
            if (prevDir) {
                jestWorkerPath = jestWorkerPath.replace(prevDir, dir);
                renderServerPath = renderServerPath.replace(prevDir, dir);
            }
            const { Worker  } = require(jestWorkerPath);
            const routerWorker = new Worker(renderServerPath, {
                numWorkers: 1,
                // TODO: do we want to allow more than 10 OOM restarts?
                maxRetries: 10,
                forkOptions: {
                    execArgv: await genRouterWorkerExecArgv(isNodeDebugging === undefined ? false : isNodeDebugging),
                    env: {
                        FORCE_COLOR: "1",
                        ...initialEnv || process.env,
                        PORT: port + "",
                        NODE_OPTIONS: getNodeOptionsWithoutInspect(),
                        ...process.env.NEXT_CPU_PROF ? {
                            __NEXT_PRIVATE_CPU_PROFILE: `CPU.router`
                        } : {},
                        WATCHPACK_WATCHER_LIMIT: "20"
                    }
                },
                exposedMethods: [
                    "initialize"
                ]
            });
            let didInitialize = false;
            for (const _worker of ((_routerWorker__workerPool = routerWorker._workerPool) == null ? void 0 : _routerWorker__workerPool._workers) || []){
                // eslint-disable-next-line no-loop-func
                _worker._child.on("exit", (code, signal)=>{
                    // catch failed initializing without retry
                    if ((code || signal) && !didInitialize) {
                        routerWorker == null ? void 0 : routerWorker.end();
                        process.exit(1);
                    }
                });
            }
            const workerStdout = routerWorker.getStdout();
            const workerStderr = routerWorker.getStderr();
            workerStdout.on("data", (data)=>{
                if (typeof onStdout === "function") {
                    onStdout(data);
                } else {
                    process.stdout.write(data);
                }
            });
            workerStderr.on("data", (data)=>{
                if (typeof onStderr === "function") {
                    onStderr(data);
                } else {
                    process.stderr.write(data);
                }
            });
            const { port: routerPort  } = await routerWorker.initialize({
                dir,
                port,
                hostname,
                dev: !!isDev,
                workerType: "router",
                isNodeDebugging: !!isNodeDebugging,
                keepAliveTimeout
            });
            didInitialize = true;
            const getProxyServer = (pathname)=>{
                const targetUrl = `http://${targetHost === "localhost" ? "127.0.0.1" : targetHost}:${routerPort}${pathname}`;
                const proxyServer = httpProxy.createProxy({
                    target: targetUrl,
                    changeOrigin: false,
                    ignorePath: true,
                    xfwd: true,
                    ws: true,
                    followRedirects: false
                });
                proxyServer.on("error", (_err)=>{
                // TODO?: enable verbose error logs with --debug flag?
                });
                return proxyServer;
            };
            // proxy to router worker
            requestHandler = async (req, res)=>{
                const urlParts = (req.url || "").split("?");
                const urlNoQuery = urlParts[0];
                // this normalizes repeated slashes in the path e.g. hello//world ->
                // hello/world or backslashes to forward slashes, this does not
                // handle trailing slash as that is handled the same as a next.config.js
                // redirect
                if (urlNoQuery == null ? void 0 : urlNoQuery.match(/(\\|\/\/)/)) {
                    const cleanUrl = normalizeRepeatedSlashes(req.url);
                    res.statusCode = 308;
                    res.setHeader("Location", cleanUrl);
                    res.end(cleanUrl);
                    return;
                }
                const proxyServer = getProxyServer(req.url || "/");
                // http-proxy does not properly detect a client disconnect in newer
                // versions of Node.js. This is caused because it only listens for the
                // `aborted` event on the our request object, but it also fully reads
                // and closes the request object. Node **will not** fire `aborted` when
                // the request is already closed. Listening for `close` on our response
                // object will detect the disconnect, and we can abort the proxy's
                // connection.
                proxyServer.on("proxyReq", (proxyReq)=>{
                    res.on("close", ()=>proxyReq.destroy());
                });
                proxyServer.on("proxyRes", (proxyRes)=>{
                    res.on("close", ()=>proxyRes.destroy());
                });
                proxyServer.web(req, res);
            };
            upgradeHandler = async (req, socket, head)=>{
                const proxyServer = getProxyServer(req.url || "/");
                proxyServer.ws(req, socket, head);
            };
            handlersReady();
        } else {
            // when not using a worker start next in main process
            const next = require("../next");
            const addr = server.address();
            const app = next({
                dir,
                hostname,
                dev: isDev,
                isNodeDebugging,
                httpServer: server,
                customServer: false,
                port: addr && typeof addr === "object" ? addr.port : port
            });
            // handle in process
            requestHandler = app.getRequestHandler();
            upgradeHandler = app.getUpgradeHandler();
            await app.prepare();
            handlersReady();
        }
    } catch (err) {
        // fatal error if we can't setup
        handlersError();
        console.error(err);
        process.exit(1);
    }
    // return teardown function for destroying the server
    async function teardown() {
        server.close();
        sockets.forEach((socket)=>{
            sockets.delete(socket);
            socket.destroy();
        });
        if (worker) {
            await worker.end();
        }
    }
    return teardown;
}

//# sourceMappingURL=start-server.js.map