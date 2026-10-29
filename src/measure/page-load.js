import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";
import { setupWebVitalsObservers, captureWebVitals } from "../metrics/web-vitals.js";
import { captureNavigationTimings } from "../metrics/navigation.js";
import { captureChromeMetrics } from "../metrics/chrome.js";
import { extractRequestMetricsFromTrace } from "../metrics/trace.js";
import * as store from "../storage/store.js";
import { normalizeMetrics, deepRound, averageValues } from "../utils/normalize.js";
import { generateReport } from "../report/generate.js";

function tempTracePath() {
    return join(tmpdir(), `puppeteer-perf-trace-${randomBytes(4).toString("hex")}.json`);
}

async function createPage(browser, { webVitals = false, disableCache = true } = {}) {
    const page = await browser.newPage();
    if (disableCache) await page.setCacheEnabled(false);
    if (webVitals) await setupWebVitalsObservers(page);
    const client = await page.createCDPSession();
    await client.send("Performance.enable");
    return { page, client };
}

async function runPageLoad(browser, url) {
    const { page, client } = await createPage(browser, { webVitals: true });
    const tracePath = tempTracePath();

    await page.tracing.start({ path: tracePath });
    console.log("  Loading: " + url);
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.tracing.stop();

    // Finalize LCP by hiding the page (LCP is only reported on visibility change or input)
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await new Promise(r => setTimeout(r, 200));

    const [navigationTimings, chromeMetrics, webVitals] = await Promise.all([
        captureNavigationTimings(page),
        captureChromeMetrics(client),
        captureWebVitals(page),
    ]);

    const traceData = JSON.parse(await fs.readFile(tracePath, "utf8"));
    const requestMetrics = extractRequestMetricsFromTrace(traceData);
    await fs.unlink(tracePath).catch(() => {});

    await page.close();
    return { navigationTimings, chromeMetrics, webVitals, requestMetrics };
}

export async function measurePageLoad(browser, testName, url, iterations = 1) {
    console.log(`Running '${testName}' - ${iterations} iteration(s)`);

    const navResults = [];
    const chromeResults = [];
    const vitalsResults = [];
    const requestResults = [];

    for (let i = 0; i < iterations; i++) {
        console.log(`Iteration ${i + 1}/${iterations}`);
        const result = await runPageLoad(browser, url);

        navResults.push(result.navigationTimings);
        chromeResults.push({
            ...result.chromeMetrics.durations,
            ...result.chromeMetrics.measures,
        });
        vitalsResults.push(result.webVitals);
        requestResults.push(result.requestMetrics);
    }

    const avgNav = averageValues(navResults);
    const avgChrome = averageValues(chromeResults);
    const avgVitals = averageValues(vitalsResults);

    const runData = {
        testName,
        url,
        runTime: Date.now(),
        timings: normalizeMetrics({
            ttfb: avgNav.ttfb,
            fcp: avgVitals.fcp,
            lcp: avgVitals.lcp,
            domContentLoaded: avgNav.domContentLoaded,
            domComplete: avgNav.domComplete,
            fullTime: avgNav.fullTime,
            LayoutDuration: avgChrome.LayoutDuration,
            RecalcStyleDuration: avgChrome.RecalcStyleDuration,
            ScriptDuration: avgChrome.ScriptDuration,
            TaskDuration: avgChrome.TaskDuration,
        }),
        metrics: {
            ...normalizeMetrics({
                Documents: avgChrome.Documents,
                Nodes: avgChrome.Nodes,
                JSEventListeners: avgChrome.JSEventListeners,
                LayoutCount: avgChrome.LayoutCount,
                RecalcStyleCount: avgChrome.RecalcStyleCount,
                JSHeapUsedSize: avgChrome.JSHeapUsedSize,
            }),
            cls: Math.round(avgVitals.cls * 1000) / 1000,
        },
        // Use the median iteration for request breakdown (least affected by outliers)
        requests: deepRound(pickMedianByTotal(requestResults)),
    };

    const lastResult = store.getLastResult(testName);
    const saved = store.reportData(runData);
    const previousRunData = lastResult ?? saved;

    generateReport(previousRunData, saved);
    printSummary(saved, previousRunData);

    return saved;
}

function pickMedianByTotal(requestResults) {
    if (requestResults.length === 1) return requestResults[0];
    const sorted = [...requestResults].sort(
        (a, b) => a.totalRequestDuration - b.totalRequestDuration
    );
    return sorted[Math.floor(sorted.length / 2)];
}

// --- Console summary ---

function printSummary(current, previous) {
    const isSameRun = current.id === previous.id;
    const sep = "-".repeat(60);

    console.log("\n" + sep);
    console.log(`  Run #${current.id}  ${current.testName}  ${current.url}`);
    console.log(sep);

    const timingRows = [
        ["TTFB", "ttfb"],
        ["FCP", "fcp"],
        ["LCP", "lcp"],
        ["DOM Complete", "domComplete"],
        ["Full Load", "fullTime"],
    ];

    const metricRows = [
        ["DOM Nodes", "nodes"],
        ["JS Heap", "jsHeapUsedSize"],
        ["CLS", "cls"],
        ["Requests", null],
    ];

    console.log("");
    console.log("  Timings            Current     Previous    Change");
    console.log("  " + "-".repeat(56));
    for (const [label, key] of timingRows) {
        const curr = current.timings[key];
        const prev = isSameRun ? null : previous.timings[key];
        console.log("  " + summaryRow(label, curr, prev, formatMs));
    }

    console.log("");
    console.log("  Metrics            Current     Previous    Change");
    console.log("  " + "-".repeat(56));
    for (const [label, key] of metricRows) {
        if (key === null) {
            const curr = current.requests.numberRequests;
            const prev = isSameRun ? null : previous.requests.numberRequests;
            console.log("  " + summaryRow(label, curr, prev, String));
            continue;
        }
        const curr = current.metrics[key];
        const prev = isSameRun ? null : previous.metrics[key];
        const fmt = key === "jsHeapUsedSize" ? formatBytes
            : key === "cls" ? v => v.toFixed(3)
            : String;
        console.log("  " + summaryRow(label, curr, prev, fmt));
    }

    console.log("\n" + sep);
    console.log(`  Report: generated/pageload/${current.testName}.html`);
    console.log(sep + "\n");
}

function summaryRow(label, current, previous, fmt) {
    const name = label.padEnd(18);
    const curr = fmt(current).padStart(10);
    if (previous == null) {
        return `${name}${curr}`;
    }
    const prev = fmt(previous).padStart(12);
    const pct = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
    const rounded = Math.round(pct);
    const sign = rounded > 0 ? "+" : "";
    const change = (`${sign}${rounded}%`).padStart(10);
    return `${name}${curr}${prev}${change}`;
}

function formatMs(ms) {
    if (ms == null) return "-";
    return ms >= 1000 ? (ms / 1000).toFixed(2) + "s" : Math.round(ms) + "ms";
}

function formatBytes(bytes) {
    if (bytes == null) return "-";
    if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + "MB";
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + "KB";
    return bytes + "B";
}
