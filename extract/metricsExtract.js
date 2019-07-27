const CHROME_TIMING_FIELDS = ["FirstMeaningfulPaint"]; // in relation to navigation start time
const CHROME_DURATION_FIELDS = [
    "LayoutDuration",
    "RecalcStyleDuration",
    "ScriptDuration",
    "TaskDuration"
];
const CHROME_METRIC_FIELDS = [
    "Documents",
    "JSEventListeners",
    "LayoutObjects",
    "Nodes",
    "Resources",
    "LayoutCount",
    "RecalcStyleCount",
    "JSHeapUsedSize"
];

const getTimeFromPerformanceMetrics = (metrics, name) =>
    metrics.metrics.find(x => x.name === name).value * 1000;

const getMeasureFromPerformanceMetrics = (metrics, name) =>
    metrics.metrics.find(x => x.name === name).value;

// from chrome specific metrics
function extractMeasuresFromPerfMetrics(metrics) {
    const navigationStart = getTimeFromPerformanceMetrics(
        metrics,
        "NavigationStart"
    );

    const extractedData = {};
    CHROME_TIMING_FIELDS.forEach(name => {
        const timing = getTimeFromPerformanceMetrics(metrics, name);
        extractedData[name] = timing - navigationStart;
    });

    CHROME_DURATION_FIELDS.forEach(name => {
        extractedData[name] = getTimeFromPerformanceMetrics(metrics, name);
    });

    CHROME_METRIC_FIELDS.forEach(name => {
        extractedData[name] = getMeasureFromPerformanceMetrics(metrics, name);
    });

    // all measurements in ms
    return extractedData;
}

function extractMeasuresFromWindowMetrics(metrics) {
    return {
        dnsLookup: metrics.domainLookupEnd - metrics.domainLookupStart,
        tcpConnect: metrics.connectEnd - metrics.connectStart,
        request: metrics.responseStart - metrics.requestStart,
        response: metrics.responseEnd - metrics.responseStart,
        domLoaded: metrics.domComplete - metrics.domLoading,
        domContentLoaded:
            metrics.domContentLoadedEventEnd - metrics.navigationStart,
        domInteractive: metrics.domInteractive - metrics.navigationStart,
        pageLoad: metrics.loadEventEnd - metrics.loadEventStart,
        fullTime: metrics.loadEventEnd - metrics.navigationStart
    };
}

module.exports = {
    extractMeasuresFromPerfMetrics,
    extractMeasuresFromWindowMetrics
};
