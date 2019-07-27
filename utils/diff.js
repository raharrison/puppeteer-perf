const previousTimings = {
    dnsLookup: 2,
    tcpConnect: 77,
    request: 26,
    response: 1,
    domLoaded: 345,
    domContentLoaded: 332,
    domInteractive: 331,
    pageLoad: 0,
    fullTime: 473,
    firstMeaningfulPaint: 442.406,
    layoutDuration: 79.802,
    recalcStyleDuration: 22.391,
    scriptDuration: 33.691,
    taskDuration: 185.48,
    documents: 14,
    jSEventListeners: 10,
    layoutObjects: 1994,
    nodes: 2387,
    resources: 16,
    layoutCount: 5,
    recalcStyleCount: 4,
    jSHeapUsedSize: 3638904
};
const currentTimings = {
    dnsLookup: 34,
    tcpConnect: 81,
    request: 33,
    response: 1,
    domLoaded: 348,
    domContentLoaded: 384,
    domInteractive: 383,
    pageLoad: 0,
    fullTime: 519,
    firstMeaningfulPaint: 490.424,
    layoutDuration: 74.23,
    recalcStyleDuration: 21.62,
    scriptDuration: 31.366,
    taskDuration: 170.748,
    documents: 14,
    jSEventListeners: 10,
    layoutObjects: 1994,
    nodes: 2387,
    resources: 16,
    layoutCount: 4,
    recalcStyleCount: 4,
    jSHeapUsedSize: 3901112
};

const previousTracing = {
    js: {
        numberRequests: 2,
        totalEncodedSize: 48.254,
        totalDecodedSize: 129.739,
        totalRequestDuration: 194.049,
        averageRequestDuration: 97.025,
        breakdown: [
            {
                url: "https://ryanharrison.co.uk/js/site.js",
                duration: 90.554,
                requestMethod: "GET",
                statusCode: 200,
                encodedDataLength: 30.698,
                decodedDataLength: 86.49
            },
            {
                url: "https://www.google-analytics.com/analytics.js",
                duration: 103.495,
                requestMethod: "GET",
                statusCode: 200,
                encodedDataLength: 17.556,
                decodedDataLength: 43.249
            }
        ]
    },
    css: {
        numberRequests: 2,
        totalEncodedSize: 9.48,
        totalDecodedSize: 26.12,
        totalRequestDuration: 123.406,
        averageRequestDuration: 61.703,
        breakdown: [
            {
                url: "https://ryanharrison.co.uk/css/main.css",
                duration: 28.192,
                requestMethod: "GET",
                statusCode: 200,
                encodedDataLength: 8.991,
                decodedDataLength: 25.216
            },
            {
                url:
                    "https://fonts.googleapis.com/css?family=PT+Serif:400,400italic,700%7CPT+Sans:400",
                duration: 95.214,
                requestMethod: "GET",
                statusCode: 200,
                encodedDataLength: 0.489,
                decodedDataLength: 0.904
            }
        ]
    },
    xhr: {
        numberRequests: 0,
        totalEncodedSize: 0,
        totalDecodedSize: 0,
        totalRequestDuration: 0,
        averageRequestDuration: 0,
        breakdown: []
    },
    images: {
        numberRequests: 3,
        totalEncodedSize: 2.37,
        totalDecodedSize: 1.759,
        totalRequestDuration: 153.047,
        averageRequestDuration: 51.016,
        breakdown: [
            {
                url: "https://ryanharrison.co.uk/images/avatar.png",
                duration: 93.933,
                requestMethod: "GET",
                statusCode: 200,
                encodedDataLength: 0.411,
                decodedDataLength: 0.187
            },
            {
                url: "https://ryanharrison.co.uk/images/arrow.png",
                duration: 35.364,
                requestMethod: "GET",
                statusCode: 200,
                encodedDataLength: 1.765,
                decodedDataLength: 1.538
            },
            {
                url:
                    "https://www.google-analytics.com/r/collect?v=1&_v=j77&a=116630089&t=pageview&_s=1&dl=https%3A%2F%2Fryanharrison.co.uk%2F&dp=%2F&ul=en-us&de=UTF-8&dt=Home&sd=24-bit&sr=800x600&vp=800x600&je=0&_u=IEBAAEAB~&jid=1564168956&gjid=1026494157&cid=189351203.1563725693&tid=UA-90740127-1&_gid=690494883.1563725693&_r=1&z=1819402890",
                duration: 23.75,
                requestMethod: "GET",
                statusCode: 200,
                encodedDataLength: 0.194,
                decodedDataLength: 0.034
            }
        ]
    },
    numberRequests: 9,
    totalEncodedSize: 130.907,
    totalDecodedSize: 300.432,
    totalRequestDuration: 619.773,
    averageRequestDuration: 68.864
};
const currentTracing = {
    js: {
        numberRequests: 2,
        totalEncodedSize: 48.254,
        totalDecodedSize: 129.739,
        totalRequestDuration: 192.838,
        averageRequestDuration: 96.419,
        breakdown: [
            {
                url: "https://ryanharrison.co.uk/js/site.js",
                duration: 94.141,
                requestMethod: "GET",
                statusCode: 200,
                encodedDataLength: 30.698,
                decodedDataLength: 86.49
            },
            {
                url: "https://www.google-analytics.com/analytics.js",
                duration: 98.697,
                requestMethod: "GET",
                statusCode: 200,
                encodedDataLength: 17.556,
                decodedDataLength: 43.249
            }
        ]
    },
    css: {
        numberRequests: 2,
        totalEncodedSize: 9.48,
        totalDecodedSize: 26.12,
        totalRequestDuration: 138.113,
        averageRequestDuration: 69.057,
        breakdown: [
            {
                url: "https://ryanharrison.co.uk/css/main.css",
                duration: 27.276,
                requestMethod: "GET",
                statusCode: 200,
                encodedDataLength: 8.991,
                decodedDataLength: 25.216
            },
            {
                url:
                    "https://fonts.googleapis.com/css?family=PT+Serif:400,400italic,700%7CPT+Sans:400",
                duration: 110.837,
                requestMethod: "GET",
                statusCode: 200,
                encodedDataLength: 0.489,
                decodedDataLength: 0.904
            }
        ]
    },
    xhr: {
        numberRequests: 0,
        totalEncodedSize: 0,
        totalDecodedSize: 0,
        totalRequestDuration: 0,
        averageRequestDuration: 0,
        breakdown: []
    },
    images: {
        numberRequests: 3,
        totalEncodedSize: 2.37,
        totalDecodedSize: 1.759,
        totalRequestDuration: 138.837,
        averageRequestDuration: 46.279,
        breakdown: [
            {
                url: "https://ryanharrison.co.uk/images/avatar.png",
                duration: 90.532,
                requestMethod: "GET",
                statusCode: 200,
                encodedDataLength: 0.411,
                decodedDataLength: 0.187
            },
            {
                url: "https://ryanharrison.co.uk/images/arrow.png",
                duration: 24.954,
                requestMethod: "GET",
                statusCode: 200,
                encodedDataLength: 1.765,
                decodedDataLength: 1.538
            },
            {
                url:
                    "https://www.google-analytics.com/r/collect?v=1&_v=j77&a=1981038895&t=pageview&_s=1&dl=https%3A%2F%2Fryanharrison.co.uk%2F&dp=%2F&ul=en-us&de=UTF-8&dt=Home&sd=24-bit&sr=800x600&vp=800x600&je=0&_u=IEBAAEAB~&jid=1024882485&gjid=643033818&cid=1014512040.1563729133&tid=UA-90740127-1&_gid=1570233955.1563729133&_r=1&z=1168386015",
                duration: 23.351,
                requestMethod: "GET",
                statusCode: 200,
                encodedDataLength: 0.194,
                decodedDataLength: 0.034
            }
        ]
    },
    numberRequests: 9,
    totalEncodedSize: 130.908,
    totalDecodedSize: 300.432,
    totalRequestDuration: 615.775,
    averageRequestDuration: 68.419
};
function diffNumber(previous, current) {
    if (previous == null) return { current: current };
    return {
        previous: previous,
        current: current,
        changePercent: ((current - previous) / previous) * 100
    };
}

function diffMetrics(previous, current) {
    if (previous == null) return { current: current };
    const diff = {};
    Object.keys(current).forEach(k => {
        if (typeof current[k] === "number") {
            diff[k] = diffNumber(previous[k], current[k]);
        } else if (
            typeof current[k] === "object" &&
            !(current[k] instanceof Array)
        ) {
            diff[k] = diffMetrics(previous[k], current[k]);
        }
    });
    return diff;
}

module.exports = {
    previousTimings,
    currentTimings,
    previousTracing,
    currentTracing,
    diffMetrics
};

// const res = diffMetrics(previousTimings, currentTimings);
// console.log(JSON.stringify(res, null, 2));
