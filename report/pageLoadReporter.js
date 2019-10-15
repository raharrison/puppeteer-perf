const fs = require("fs");
const diff = require("../utils/diff");
const Handlebars = require("handlebars");
require("./handlebarsHelpers");
const measureStore = require("../db/flat/measureStore");
const buildVendor = require("./buildVendor");

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

async function constructTrendChart(testName, chartId, title, metrics, data = null) {
    const datasets = [];
    let labels;
    for (const metric of metrics) {
        const rawData = data || (await measureStore.getMetricTrend(testName, metric));
        labels = rawData.map(e => e.id);
        datasets.push({
            label: metric,
            yData: rawData.map(e => e[metric])
        });
    }
    const chart = {
        chartId: chartId,
        chartTitle: title,
        xData: labels,
        datasets: datasets
    };
    const template = buildTemplate("lineChart.txt");
    const script = template(chart);
    chart.script = script;
    return chart;
}

async function buildOverviewTrendCharts(testName) {
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

async function buildRequestTypeTrends(testName) {
    const rawData = await measureStore.getRequestTypeTrend(testName);
    const trends = {};
    for (const key of Object.keys(rawData)) {
        trends[key] = [
            await constructTrendChart(
                testName,
                key + "TimingTrends",
                "Timing Trends (ms)",
                ["totalRequestDuration"],
                rawData[key]
            ),
            await constructTrendChart(
                testName,
                key + "RequestTrends",
                "Request Trends (KB)",
                ["totalEncodedSize", "totalDecodedSize"],
                rawData[key]
            )
        ];
    }
    return trends;
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

    const overviewTrends = await buildOverviewTrendCharts(testName);

    const requestTypeTrends = await buildRequestTypeTrends(testName);

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
            ),
            trends: requestTypeTrends[type]
        }));

    return {
        timingDiff: Object.entries(timingDiff).map(e => ({ metric: e[0], ...e[1] })),
        metricsDiff: Object.entries(metricsDiff).map(e => ({ metric: e[0], ...e[1] })),
        tracingDiff: {
            overview,
            typeOverview
        },
        overviewTrends
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
    const testName = currentRunData.testName;
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
    res.testName = testName;
    res.url = currentRunData.url;
    res.currentRunTime = currentRunData.runTime;
    res.previousRunTime = previousRunData.runTime;
    const template = buildTemplate("pageLoadReportTemplate.html");
    const vendor = await buildVendor();
    Object.assign(res, vendor);

    const doc = template(res);
    const filename = `generated/pageload/${testName}.html`;
    fs.writeFileSync(filename, doc);
    console.log("Page load report written to: " + filename);
    // console.log(JSON.stringify(res, null, 2));
}

module.exports = {
    generatePageLoadReport
};
