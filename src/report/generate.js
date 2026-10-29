import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { diffMetrics } from "../utils/diff.js";
import * as store from "../storage/store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = readFileSync(join(__dirname, "templates", "report.html"), "utf8");

function buildRequestTypeSummary(requestData) {
    const breakdown = {};
    for (const [k, val] of Object.entries(requestData)) {
        if (!val?.breakdown) continue;
        breakdown[k] = {
            largestEncoded: [...val.breakdown]
                .sort((a, b) => b.encodedDataLength - a.encodedDataLength)
                .slice(0, 5)
                .map(e => ({ value: e.encodedDataLength, url: e.url, unit: "KB" })),
            longestDuration: [...val.breakdown]
                .sort((a, b) => b.duration - a.duration)
                .slice(0, 5)
                .map(e => ({ value: e.duration, url: e.url, unit: "ms" })),
        };
    }
    return breakdown;
}

function buildTrendChart(id, title, testName, metrics, data = null) {
    const datasets = [];
    let labels = [];
    for (const metric of metrics) {
        const raw = data ?? store.getMetricTrend(testName, metric);
        labels = raw.map(e => e.id);
        datasets.push({ label: metric, data: raw.map(e => e[metric]) });
    }
    return { id, title, labels, datasets };
}

function buildOverviewTrends(testName) {
    return [
        buildTrendChart("timingTrends", "Timing Trends (ms)", testName,
            ["fullTime", "lcp", "fcp", "ttfb", "scriptDuration"]),
        buildTrendChart("requestTrends", "Request Trends (KB)", testName,
            ["totalEncodedSize", "totalDecodedSize"]),
        buildTrendChart("metricTrends", "Metric Trends", testName,
            ["nodes", "layoutCount", "numberRequests"]),
    ];
}

function buildTypeTrends(testName) {
    const rawData = store.getRequestTypeTrend(testName);
    const trends = {};
    for (const [key, data] of Object.entries(rawData)) {
        trends[key] = [
            buildTrendChart(key + "_timing", "Timing Trends (ms)", testName,
                ["totalRequestDuration"], data),
            buildTrendChart(key + "_size", "Request Trends (KB)", testName,
                ["totalEncodedSize", "totalDecodedSize"], data),
        ];
    }
    return trends;
}

function buildReportData(previousRunData, currentRunData) {
    const testName = currentRunData.testName;
    const timingDiff = diffMetrics(previousRunData.timings, currentRunData.timings);
    const metricsDiff = diffMetrics(previousRunData.metrics, currentRunData.metrics);
    const requestsDiff = diffMetrics(previousRunData.requests, currentRunData.requests);

    const prevBreakdown = buildRequestTypeSummary(previousRunData.requests);
    const currBreakdown = buildRequestTypeSummary(currentRunData.requests);
    const typeTrends = buildTypeTrends(testName);

    const toDiffRows = obj =>
        Object.entries(obj).map(([metric, val]) => ({ metric, ...val }));

    const requestOverview = Object.entries(requestsDiff)
        .filter(([, v]) => typeof v === "object" && "previous" in v)
        .map(([k, v]) => ({ metric: k, ...v }));

    const requestTypes = Object.entries(requestsDiff)
        .filter(([, v]) => typeof v === "object" && !("previous" in v))
        .map(([type, v]) => ({
            type,
            summary: Object.entries(v)
                .filter(([, val]) => val && typeof val === "object" && "previous" in val)
                .map(([metric, val]) => ({ metric, ...val })),
            breakdown: Object.keys(currBreakdown[type] ?? {}).map(metric => ({
                metric,
                previous: prevBreakdown[type]?.[metric],
                current: currBreakdown[type]?.[metric],
            })),
            trends: typeTrends[type] ?? [],
        }));

    return {
        testName,
        url: currentRunData.url,
        currentRun: { id: currentRunData.id, time: currentRunData.runTime },
        previousRun: { id: previousRunData.id, time: previousRunData.runTime },
        timings: toDiffRows(timingDiff),
        metrics: toDiffRows(metricsDiff),
        requests: { overview: requestOverview, types: requestTypes },
        overviewTrends: buildOverviewTrends(testName),
    };
}

export function generateReport(previousRunData, currentRunData) {
    console.log(
        `Generating report - previous: #${previousRunData.id}, current: #${currentRunData.id}`
    );

    const data = buildReportData(previousRunData, currentRunData);

    const dir = "generated/pageload";
    mkdirSync(dir, { recursive: true });

    // Function replacer avoids "$" patterns in URLs being expanded; escape "<" so a URL can't close the script tag
    const json = JSON.stringify(data).replace(/</g, "\\u003c");
    const html = TEMPLATE.replace('"__REPORT_DATA__"', () => json);
    const filename = `${dir}/${currentRunData.testName}.html`;
    writeFileSync(filename, html);
    console.log("Report written to: " + filename);
}
