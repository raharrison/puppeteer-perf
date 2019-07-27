const fs = require("fs");

function findResourceSendRequests(tracing) {
    const tracingResourceSendRequests = tracing.traceEvents.filter(
        x =>
            x.cat === "devtools.timeline" &&
            typeof x.args.data !== "undefined" &&
            typeof x.args.data.url !== "undefined" &&
            x.name === "ResourceSendRequest" &&
            !x.args.data.url.startsWith("data:image") // ignore svg
    );

    return tracingResourceSendRequests.map(r => ({
        sendRequestTs: r.ts / 1000,
        requestId: r.args.data.requestId,
        requestMethod: r.args.data.requestMethod,
        url: r.args.data.url,
        priority: r.args.data.priority
    }));
}

function findResourceReceiveResponse(tracing, requestId) {
    const resourceResponse = tracing.traceEvents.find(
        x =>
            x.cat === "devtools.timeline" &&
            typeof x.args.data !== "undefined" &&
            x.args.data.requestId == requestId &&
            x.name === "ResourceReceiveResponse"
    );
    return {
        resourceResponseTs: resourceResponse.ts / 1000,
        statusCode: resourceResponse.args.data.statusCode,
        mimeType: resourceResponse.args.data.mimeType,
        fromCache: resourceResponse.args.data.fromCache
    };
}

function findResourceFinish(tracing, requestId) {
    const resourceFinish = tracing.traceEvents.find(
        x =>
            x.cat === "devtools.timeline" &&
            typeof x.args.data !== "undefined" &&
            x.args.data.requestId == requestId &&
            x.name === "ResourceFinish"
    );
    return {
        finishRequestTs: resourceFinish.ts / 1000,
        didFail: resourceFinish.args.data.didFail,
        encodedDataLength: resourceFinish.args.data.encodedDataLength / 1024,
        decodedBodyLength: resourceFinish.args.data.decodedBodyLength / 1024
    };
}

function extractRequestsFromTrace(tracing) {
    const resourceRequests = findResourceSendRequests(tracing);
    resourceRequests.forEach(r => {
        const resourceRecieved = findResourceReceiveResponse(
            tracing,
            r.requestId
        );
        const resourceFinish = findResourceFinish(tracing, r.requestId);
        Object.assign(r, resourceRecieved, resourceFinish);
    });
    return resourceRequests;
}

function extractCountersFromTrace(tracing) {
    return tracing.traceEvents
        .filter(
            x =>
                x.name === "UpdateCounters" &&
                typeof x.args.data !== "undefined"
        )
        .map(c => ({
            ts: c.ts,
            documents: c.args.data.documents,
            nodes: c.args.data.nodes,
            jsEventListeners: c.args.data.jsEventListeners,
            jsHeapSizeUsed: c.args.data.jsHeapSizeUsed
        }));
}

function calculateSummaryStats(requests) {
    const totalRequestDuration = requests.reduce(
        (acc, curr) => acc + (curr.finishRequestTs - curr.sendRequestTs),
        0
    );
    return {
        numberRequests: requests.length,
        totalEncodedSize: requests.reduce(
            (acc, curr) => acc + curr.encodedDataLength,
            0
        ),
        totalDecodedSize: requests.reduce(
            (acc, curr) => acc + curr.decodedBodyLength,
            0
        ),
        totalRequestDuration,
        averageRequestDuration: totalRequestDuration / (requests.length || 1)
    };
}

function createRequestTypeBreakdown(requests) {
    return requests.map(r => {
        return {
            url: r.url,
            duration: r.finishRequestTs - r.sendRequestTs,
            requestMethod: r.requestMethod,
            statusCode: r.statusCode,
            encodedDataLength: r.encodedDataLength,
            decodedDataLength: r.decodedBodyLength
        };
    });
}

function extractMimeMetrics(requests, types) {
    const mimeReqs = requests.filter(r => types.includes(r.mimeType));
    const summaryStats = calculateSummaryStats(mimeReqs);
    const breakdown = createRequestTypeBreakdown(mimeReqs);
    return { ...summaryStats, breakdown };
}

function extractRequestMetricsFromTrace(tracing) {
    const requests = extractRequestsFromTrace(tracing);
    return {
        js: extractMimeMetrics(requests, [
            "application/javascript",
            "text/javascript"
        ]),
        css: extractMimeMetrics(requests, ["text/css"]),
        xhr: extractMimeMetrics(requests, ["application/json"]),
        images: extractMimeMetrics(requests, [
            "image/png",
            "image/gif",
            "image/jpeg"
        ]),
        ...calculateSummaryStats(requests)
    };
}

module.exports = {
    extractRequestMetricsFromTrace,
    extractCountersFromTrace
};

// fs.readFile("trace.json", (_err, data) => {
//     const tracing = JSON.parse(data);
//     const metrics = extractRequestMetricsFromTrace(tracing);
//     console.log(JSON.stringify(metrics, null, 4));

//     const counters = extractCountersFromTrace(tracing);
//     // console.log(counters);
// });
