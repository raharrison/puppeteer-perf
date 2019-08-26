const fs = require("fs");
const diff = require("../utils/diff");
const Handlebars = require("handlebars");
const measureStore = require("../db/measureStore");

Handlebars.registerHelper("limit", (e, max) => e && e.slice(0, max || 100));

Handlebars.registerHelper("tableRowClass", e => {
    return !e || Math.abs(e) < 4 ? "" : e < 0 ? "table-success " : "table-danger";
});

Handlebars.registerHelper("friendlyName", e => {
    if (e.length <= 3) return e.toUpperCase();
    return e.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
});

Handlebars.registerHelper("toPercentBadge", e => {
    const rounded = Math.round(e);
    const value = rounded > 0 ? "+" + rounded : rounded;
    let klass = "badge badge-primary";
    if (rounded < 0) klass = "badge badge-success";
    else if (rounded > 0) klass = "badge badge-danger";

    return `<span class="${klass}">${value}%</span>`;
});

Handlebars.registerHelper("dateFormat", t => {
    const date = new Date(t);
    return (
        `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()} ` +
        date.toLocaleTimeString()
    );
});

Handlebars.registerHelper("urlPath", t => {
    if (!t) return t;
    const url = new URL(t);
    return (url.pathname + url.search).slice(0, 85);
});

const buildTemplate = name => {
    const src = fs.readFileSync(`report/templates/${name}`, "utf8");
    return Handlebars.compile(src);
};

function buildRequestTypeSummary(tracingData) {
    const breakdown = {};
    for (k in tracingData) {
        const val = tracingData[k];
        if (val.breakdown) {
            const largestEncoded = val.breakdown
                .sort((a, b) => b.encodedDataLength - a.encodedDataLength)
                .slice(0, 5)
                .map(e => ({ value: e.encodedDataLength, url: e.url, unit: "kb" }));
            const longestDuration = val.breakdown
                .sort((a, b) => b.duration - a.duration)
                .slice(0, 5)
                .map(e => ({ value: e.duration, url: e.url, unit: "ms" }));

            breakdown[k] = {
                largestEncoded,
                longestDuration
            };
        }
    }
    return breakdown;
}

async function constructTrendChart(testName, id, title, metrics) {
    const datasets = [];
    let labels;
    for (const metric of metrics) {
        const rawData = await measureStore.getMetricTrend(testName, metric);
        labels = rawData.map(e => e.id);
        datasets.push({
            label: metric,
            yData: rawData.map(e => e[metric])
        });
    }
    const chart = {
        chartId: id,
        chartTitle: title,
        xData: labels,
        datasets: datasets
    };
    const template = buildTemplate("lineChart.txt");
    const script = template(chart);
    chart.script = script;
    return chart;
}

async function buildTrendCharts(testName) {
    const timingChart = await constructTrendChart(
        testName,
        "timingTrends",
        "Timing Trends (ms)",
        ["totalRequestDuration", "firstMeaningfulPaint", "fullTime", "scriptDuration"]
    );
    const metricChart = await constructTrendChart(
        testName,
        "metricTrends",
        "Metric Trends",
        ["documents", "jSEventListeners", "layoutCount", "numberRequests"]
    );
    const requestChart = await constructTrendChart(
        testName,
        "requestTrends",
        "Request Trends (KB)",
        ["totalEncodedSize", "totalDecodedSize"]
    );
    return [timingChart, requestChart, metricChart];
}

async function constructReportData(
    testName,
    previousTiming,
    currentTiming,
    previousMetrics,
    currentMetrics,
    previousTracing,
    currentTracing
) {
    const timingDiff = diff.diffMetrics(previousTiming, currentTiming);
    const metricsDiff = diff.diffMetrics(previousMetrics, currentMetrics);
    const tracingDiff = diff.diffMetrics(previousTracing, currentTracing);

    const previousRequestTypeSummary = buildRequestTypeSummary(previousTracing);
    const currentRequestTypeSummary = buildRequestTypeSummary(currentTracing);

    const trends = await buildTrendCharts(testName);

    // split between overview metrics and mime type specific
    const overview = Object.entries(tracingDiff)
        .filter(([_, v]) => v.hasOwnProperty("previous"))
        .map(([k, v]) => ({ metric: k, ...v }));

    const typeOverview = Object.entries(tracingDiff)
        .filter(([_, v]) => !v.hasOwnProperty("previous"))
        .map(([type, v]) => ({
            type,
            summary: Object.entries(v).map(e => ({ metric: e[0], ...e[1] })),
            breakdown: Object.entries(currentRequestTypeSummary[type]).map(
                ([metric, _]) => {
                    return {
                        metric,
                        previous: previousRequestTypeSummary[type][metric],
                        current: currentRequestTypeSummary[type][metric]
                    };
                }
            )
        }));

    return {
        timingDiff: Object.entries(timingDiff).map(e => ({ metric: e[0], ...e[1] })),
        metricsDiff: Object.entries(metricsDiff).map(e => ({ metric: e[0], ...e[1] })),
        tracingDiff: {
            overview,
            typeOverview
        },
        trends
    };
}

function removeNotAllowedFields(data) {
    const notAllowed = [
        "dnsLookup",
        "tcpConnect",
        "request",
        "response",
        "pageLoad",
        "domLoaded",
        "domInteractive"
    ];
    return Object.keys(data)
        .filter(key => !notAllowed.includes(key))
        .reduce((obj, key) => {
            obj[key] = data[key];
            return obj;
        }, {});
}

async function generatePageLoadReport(previousRunData, currentRunData) {
    console.log(
        "Generating load time report for previous run id: " +
            previousRunData.id +
            " and current id: " +
            currentRunData.id
    );
    const res = await constructReportData(
        currentRunData.testName,
        removeNotAllowedFields(previousRunData.timings),
        removeNotAllowedFields(currentRunData.timings),
        previousRunData.metrics,
        currentRunData.metrics,
        previousRunData.tracing,
        currentRunData.tracing
    );
    res.testName = currentRunData.testName;
    res.url = currentRunData.url;
    res.currentRunTime = currentRunData.runTime;
    res.previousRunTime = previousRunData.runTime;
    const template = buildTemplate("pageLoadReportTemplate.html");
    const doc = template(res);
    fs.writeFileSync("generated/pageLoad.html", doc);
    // console.log(JSON.stringify(res, null, 2));
}

module.exports = {
    generatePageLoadReport
};
