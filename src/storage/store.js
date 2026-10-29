import { mkdirSync } from "fs";
import { LowSync } from "lowdb";
import { JSONFileSync } from "lowdb/node";

const OUTPUT_DIR = "generated";
mkdirSync(OUTPUT_DIR, { recursive: true });

const DEFAULT_DATA = { measures: [], nextId: 1 };
const db = new LowSync(new JSONFileSync(`${OUTPUT_DIR}/data.json`), DEFAULT_DATA);
db.read();

export function reportData(runData) {
    db.read();
    const record = { ...runData, id: db.data.nextId };
    db.data.measures.push(record);
    db.data.nextId += 1;
    db.write();
    return record;
}

export function getLastResult(testName) {
    db.read();
    const results = db.data.measures
        .filter(e => e.testName === testName)
        .sort((a, b) => b.runTime - a.runTime);
    return results[0] ?? null;
}

export function getMetricTrend(testName, metric) {
    db.read();
    const results = db.data.measures
        .filter(e => e.testName === testName)
        .sort((a, b) => a.runTime - b.runTime)
        .slice(-20);

    return results.map(e => ({
        id: e.id,
        runTime: e.runTime,
        [metric]: e.timings?.[metric] ?? e.metrics?.[metric] ?? e.requests?.[metric],
    }));
}

export function getRequestTypeTrend(testName) {
    db.read();
    const results = db.data.measures
        .filter(e => e.testName === testName)
        .sort((a, b) => a.runTime - b.runTime)
        .slice(-20);

    const trends = {};
    for (const e of results) {
        for (const [key, val] of Object.entries(e.requests)) {
            if (typeof val !== "object" || val === null || val.numberRequests === undefined)
                continue;
            if (!(key in trends)) trends[key] = [];
            trends[key].push({
                id: e.id,
                runTime: e.runTime,
                numberRequests: val.numberRequests,
                totalEncodedSize: val.totalEncodedSize,
                totalDecodedSize: val.totalDecodedSize,
                totalRequestDuration: val.totalRequestDuration,
            });
        }
    }
    return trends;
}
