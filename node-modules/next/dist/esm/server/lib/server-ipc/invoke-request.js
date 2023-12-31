import { filterReqHeaders } from "./utils";
export const invokeRequest = async (targetUrl, requestInit, readableBody)=>{
    const invokeHeaders = filterReqHeaders({
        ...requestInit.headers
    });
    const invokeRes = await new Promise((resolveInvoke, rejectInvoke)=>{
        const http = require("http");
        try {
            // force to 127.0.0.1 as IPC always runs on this hostname
            // to avoid localhost issues
            const parsedTargetUrl = new URL(targetUrl);
            parsedTargetUrl.hostname = "127.0.0.1";
            const invokeReq = http.request(parsedTargetUrl.toString(), {
                headers: invokeHeaders,
                method: requestInit.method
            }, (res)=>{
                resolveInvoke(res);
            });
            invokeReq.on("error", (err)=>{
                rejectInvoke(err);
            });
            if (requestInit.method !== "GET" && requestInit.method !== "HEAD") {
                if (readableBody) {
                    readableBody.pipe(invokeReq);
                    readableBody.on("close", ()=>{
                        invokeReq.end();
                    });
                }
            } else {
                invokeReq.end();
            }
        } catch (err) {
            rejectInvoke(err);
        }
    });
    return invokeRes;
};

//# sourceMappingURL=invoke-request.js.map