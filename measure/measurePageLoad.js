const fs = require("fs").promises;
const metricsExtract = require("../extract/metricsExtract");
const tracingExtract = require("../extract/traceExtract");
const measureStore = require("../db/measureStore");
const normalize = require("../utils/normalize");

const TRACING_LOCATION = "./trace.json";

async function initPage(browser) {
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    const client = await page.target().createCDPSession();
    await client.send("Performance.enable");
    return { client, page };
}

async function captureWindowTimings(page) {
    const timings = await page.evaluate(() =>
        JSON.stringify(window.performance.timing)
    );
    return metricsExtract.extractMeasuresFromWindowMetrics(JSON.parse(timings));
}

async function capturePerformanceMetrics(page, client) {
    let performanceMetrics;
    while (true) {
        await page.waitFor(300);
        const metrics = await client.send("Performance.getMetrics");
        performanceMetrics = metricsExtract.extractMeasuresFromPerfMetrics(
            metrics
        );
        if (performanceMetrics.FirstMeaningfulPaint > 0) break;
        else {
            console.log("Waiting for data...");
        }
    }
    return performanceMetrics;
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
    performanceMetrics,
    tracingMetrics
) => {
    const timingMetrics = normalize.normalizeMetrics({
        ...windowTimings,
        ...performanceMetrics
    });

    const runData = {
        testName,
        url,
        runTime: new Date().getTime(),
        timings: timingMetrics,
        tracing: normalize.deepRound(tracingMetrics)
    };

    const previousRunData =
        (await measureStore.getLastResult(testName)) || runData;
    await measureStore.reportData(runData);
    console.log("Previous id is " + previousRunData.id);
    console.log("Saved id is " + runData.id);
    return runData;
};

module.exports = {
    measurePageLoad: async (browser, testName, url) => {
        const { page, client } = await initPage(browser);
        await page.tracing.start({ path: TRACING_LOCATION });

        await page.goto(url);

        await page.tracing.stop();

        const windowTimings = await captureWindowTimings(page);
        const performanceMetrics = await capturePerformanceMetrics(
            page,
            client
        );
        const tracingMetrics = await captureTracingMetrics();

        return await processPerfData(
            testName,
            url,
            windowTimings,
            performanceMetrics,
            tracingMetrics
        );
    }
};
