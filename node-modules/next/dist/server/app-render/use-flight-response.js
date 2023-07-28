"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "useFlightResponse", {
    enumerable: true,
    get: function() {
        return useFlightResponse;
    }
});
const _nodewebstreamshelper = require("../stream-utils/node-web-streams-helper");
const _encodedecode = require("../stream-utils/encode-decode");
const _htmlescape = require("../htmlescape");
const isEdgeRuntime = process.env.NEXT_RUNTIME === "edge";
function useFlightResponse(writable, req, clientReferenceManifest, rscChunks, flightResponseRef, nonce) {
    if (flightResponseRef.current !== null) {
        return flightResponseRef.current;
    }
    const { createFromReadableStream  } = require(`react-server-dom-webpack/client.edge`);
    const [renderStream, forwardStream] = (0, _nodewebstreamshelper.readableStreamTee)(req);
    const res = createFromReadableStream(renderStream, {
        moduleMap: isEdgeRuntime ? clientReferenceManifest.edgeSSRModuleMapping : clientReferenceManifest.ssrModuleMapping
    });
    flightResponseRef.current = res;
    let bootstrapped = false;
    // We only attach CSS chunks to the inlined data.
    const forwardReader = forwardStream.getReader();
    const writer = writable.getWriter();
    const startScriptTag = nonce ? `<script nonce=${JSON.stringify(nonce)}>` : "<script>";
    const textDecoder = new TextDecoder();
    function read() {
        forwardReader.read().then(({ done , value  })=>{
            if (value) {
                rscChunks.push(value);
            }
            if (!bootstrapped) {
                bootstrapped = true;
                writer.write((0, _encodedecode.encodeText)(`${startScriptTag}(self.__next_f=self.__next_f||[]).push(${(0, _htmlescape.htmlEscapeJsonString)(JSON.stringify([
                    0
                ]))})</script>`));
            }
            if (done) {
                // Add a setTimeout here because the error component is too small, the first forwardReader.read() read will return the full chunk
                // and then it immediately set flightResponseRef.current as null.
                // react renders the component twice, the second render will run into the state with useFlightResponse where flightResponseRef.current is null,
                // so it tries to render the flight payload again
                setTimeout(()=>{
                    flightResponseRef.current = null;
                });
                writer.close();
            } else {
                const responsePartial = (0, _encodedecode.decodeText)(value, textDecoder);
                const scripts = `${startScriptTag}self.__next_f.push(${(0, _htmlescape.htmlEscapeJsonString)(JSON.stringify([
                    1,
                    responsePartial
                ]))})</script>`;
                writer.write((0, _encodedecode.encodeText)(scripts));
                read();
            }
        });
    }
    read();
    return res;
}

//# sourceMappingURL=use-flight-response.js.map