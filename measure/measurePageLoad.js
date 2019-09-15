const fs = require("fs").promises;
const metricsExtract = require("../extract/metricsExtract");
const tracingExtract = require("../extract/traceExtract");
const measureStore = require("../db/measureStore");
const normalize = require("../utils/normalize");
const reporter = require("../report/pageLoadReporter");

const TRACING_LOCATION = "./trace.json";

async function initPage(browser) {
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    return page;
}

async function initPageWithMonitor(browser) {
    const page = await initPage(browser);
    const client = await page.target().createCDPSession();
    await client.send("Performance.enable");
    return { client, page };
}

async function bootstrapUrl(browser, url) {
    console.log("Bootstrapping page load");
    const page = await initPage(browser);
    await page.goto(url, { waitUntil: "networkidle0" });
}

async function captureWindowTimings(page) {
    const timings = await page.evaluate(() => JSON.stringify(window.performance.timing));
    return metricsExtract.extractMeasuresFromWindowMetrics(JSON.parse(timings));
}

async function capturePerformanceMetrics(page, client) {
    let perfTimings, perfMetrics;
    while (true) {
        await page.waitFor(300);
        const metrics = await client.send("Performance.getMetrics");
        perfTimings = metricsExtract.extractTimingsFromPerfMetrics(metrics);
        perfMetrics = metricsExtract.extractMeasuresFromPerfMetrics(metrics);
        if (perfTimings.FirstMeaningfulPaint > 0) break;
        else {
            console.log("Waiting for data...");
        }
    }
    return { perfTimings, perfMetrics };
}

async function captureTracingMetrics() {
    const rawTracing = await fs.readFile("./trace.json", "utf8");
    const tracingMetrics = JSON.parse(rawTracing);
    return tracingExtract.extractRequestMetricsFromTrace(tracingMetrics);
}

const processPerfData = async (
    testName,
    url,
    windowTimings,
    perfTimings,
    perfMetrics,
    tracingMetrics
) => {
    const timingMetrics = normalize.normalizeMetrics({
        ...windowTimings,
        ...perfTimings
    });

    const runData = {
        testName,
        url,
        runTime: new Date().getTime(),
        timings: timingMetrics,
        metrics: normalize.normalizeMetrics(perfMetrics),
        tracing: normalize.deepRound(tracingMetrics)
    };

    const previousRunData = (await measureStore.getLastResult(testName)) || runData;
    await measureStore.reportData(runData);
    console.log("Saved run details id: " + runData.id);

    await reporter.generatePageLoadReport(previousRunData, runData);
    return runData;
};

async function runPageLoad(browser, url) {
    const { page, client } = await initPageWithMonitor(browser);
    await page.tracing.start({ path: TRACING_LOCATION });

    console.log("Loading url: " + url);
    await page.goto(url, { waitUntil: "networkidle0" });

    await page.tracing.stop();

    console.log("URL loaded, capturing metrics...");
    const windowTimings = await captureWindowTimings(page);
    const perfMetrics = await capturePerformanceMetrics(page, client);
    const tracingMetrics = await captureTracingMetrics();

    await page.close();

    console.log("Metrics captured, processing...");
    return { windowTimings, perfMetrics, tracingMetrics };
}

module.exports = {
    measurePageLoad: async (browser, testName, url, iterations = 1) => {
        await bootstrapUrl(browser, url);

        console.log(`Running '${testName}' page load for ${iterations} iterations`);

        let tracingMetricsResult;
        const windowTimingsResults = [];
        const perfTimingResults = [];
        const perfMetricsResults = [];

        for (let i = 0; i < iterations; i++) {
            console.log("Executing iteration: " + i + 1);
            const { windowTimings, perfMetrics, tracingMetrics } = await runPageLoad(
                browser,
                url
            );
            windowTimingsResults.push(windowTimings);
            perfTimingResults.push(perfMetrics.perfTimings);
            perfMetricsResults.push(perfMetrics.perfMetrics);
            tracingMetricsResult = tracingMetrics;
        }

        return await processPerfData(
            testName,
            url,
            normalize.averageValues(windowTimingsResults),
            normalize.averageValues(perfTimingResults),
            normalize.averageValues(perfMetricsResults),
            tracingMetricsResult
        );
    }
};
