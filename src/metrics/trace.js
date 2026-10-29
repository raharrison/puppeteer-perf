function findResourceSendRequests(tracing) {
    return tracing.traceEvents
        .filter(
            x =>
                x.cat === "devtools.timeline" &&
                x.args?.data?.url &&
                x.name === "ResourceSendRequest" &&
                !x.args.data.url.startsWith("data:")
        )
        .map(r => ({
            sendRequestTs: r.ts / 1000,
            requestId: r.args.data.requestId,
            requestMethod: r.args.data.requestMethod,
            url: r.args.data.url,
            priority: r.args.data.priority,
        }));
}

function indexEventsByRequestId(tracing, name) {
    const index = new Map();
    for (const x of tracing.traceEvents) {
        const requestId = x.args?.data?.requestId;
        if (x.cat === "devtools.timeline" && x.name === name && requestId != null && !index.has(requestId)) {
            index.set(requestId, x);
        }
    }
    return index;
}

function toResponse(ev) {
    return {
        resourceResponseTs: ev.ts / 1000,
        statusCode: ev.args.data.statusCode,
        mimeType: ev.args.data.mimeType,
        fromCache: ev.args.data.fromCache,
    };
}

function toFinish(ev) {
    return {
        finishRequestTs: ev.ts / 1000,
        didFail: ev.args.data.didFail,
        encodedDataLength: (ev.args.data.encodedDataLength ?? 0) / 1024,
        decodedBodyLength: (ev.args.data.decodedBodyLength ?? 0) / 1024,
    };
}

function extractRequestsFromTrace(tracing) {
    const requests = findResourceSendRequests(tracing);
    const responses = indexEventsByRequestId(tracing, "ResourceReceiveResponse");
    const finishes = indexEventsByRequestId(tracing, "ResourceFinish");
    return requests
        .map(r => {
            const response = responses.get(r.requestId);
            const finish = finishes.get(r.requestId);
            if (!response || !finish) return null;
            return { ...r, ...toResponse(response), ...toFinish(finish) };
        })
        .filter(Boolean);
}

function calculateSummaryStats(requests) {
    const totalRequestDuration = requests.reduce(
        (acc, r) => acc + (r.finishRequestTs - r.sendRequestTs),
        0
    );
    return {
        numberRequests: requests.length,
        totalEncodedSize: requests.reduce((acc, r) => acc + r.encodedDataLength, 0),
        totalDecodedSize: requests.reduce((acc, r) => acc + r.decodedBodyLength, 0),
        totalRequestDuration,
        averageRequestDuration: totalRequestDuration / (requests.length || 1),
    };
}

function createBreakdown(requests) {
    return requests.map(r => ({
        url: r.url,
        duration: r.finishRequestTs - r.sendRequestTs,
        requestMethod: r.requestMethod,
        statusCode: r.statusCode,
        encodedDataLength: r.encodedDataLength,
        decodedDataLength: r.decodedBodyLength,
    }));
}

const MIME_TYPES = {
    js: ["application/javascript", "text/javascript", "application/x-javascript"],
    css: ["text/css"],
    xhr: ["application/json", "application/xml", "text/xml"],
    images: [
        "image/png",
        "image/gif",
        "image/jpeg",
        "image/webp",
        "image/avif",
        "image/svg+xml",
    ],
    fonts: ["font/woff", "font/woff2", "application/font-woff", "application/font-woff2"],
};

function extractMimeMetrics(requests, mimeTypes) {
    const filtered = requests.filter(r => mimeTypes.includes(r.mimeType));
    return { ...calculateSummaryStats(filtered), breakdown: createBreakdown(filtered) };
}

export function extractRequestMetricsFromTrace(tracing) {
    const requests = extractRequestsFromTrace(tracing);
    const result = { ...calculateSummaryStats(requests) };
    for (const [type, mimes] of Object.entries(MIME_TYPES)) {
        result[type] = extractMimeMetrics(requests, mimes);
    }
    return result;
}
