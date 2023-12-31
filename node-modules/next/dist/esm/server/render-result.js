export default class RenderResult {
    /**
   * Creates a new RenderResult instance from a static response.
   *
   * @param value the static response value
   * @returns a new RenderResult instance
   */ static fromStatic(value) {
        return new RenderResult(value);
    }
    constructor(response, { contentType , ...metadata } = {}){
        this.response = response;
        this.contentType = contentType;
        this.metadata = metadata;
    }
    /**
   * Returns true if the response is null. It can be null if the response was
   * not found or was already sent.
   */ get isNull() {
        return this.response === null;
    }
    /**
   * Returns false if the response is a string. It can be a string if the page
   * was prerendered. If it's not, then it was generated dynamically.
   */ get isDynamic() {
        return typeof this.response !== "string";
    }
    /**
   * Returns true if the response is a stream. If the page was dynamic, this
   * will throw an error.
   *
   * @returns The response as a string
   */ toUnchunkedString() {
        if (typeof this.response !== "string") {
            throw new Error("Invariant: dynamic responses cannot be unchunked. This is a bug in Next.js");
        }
        return this.response;
    }
    async pipe(res) {
        if (this.response === null) {
            throw new Error("Invariant: response is null. This is a bug in Next.js");
        }
        if (typeof this.response === "string") {
            throw new Error("Invariant: static responses cannot be piped. This is a bug in Next.js");
        }
        const flush = "flush" in res && typeof res.flush === "function" ? res.flush.bind(res) : ()=>{};
        const reader = this.response.getReader();
        let shouldFatalError = false;
        try {
            let result = await reader.read();
            if (!result.done) {
                // As we're going to write to the response, we should destroy the
                // response if an error occurs.
                shouldFatalError = true;
            }
            while(!result.done){
                // Write the data to the response.
                res.write(result.value);
                // Flush it to the client (if it supports flushing).
                flush();
                // Read the next chunk.
                result = await reader.read();
            }
            // We're done writing to the response, so we can end it.
            res.end();
        } catch (err) {
            // If we've written to the response, we should destroy it.
            if (shouldFatalError) {
                res.destroy(err);
            }
            throw err;
        }
    }
}

//# sourceMappingURL=render-result.js.map