const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("data.json");
const db = low(adapter);

db.defaults({
    loadMeasures: [],
    loadMeasureCount: 1
}).write();

module.exports = {
    reportData: runData =>
        new Promise((resolve, _) => {
            const nextId = db.get("loadMeasureCount").value();
            runData.id = nextId;
            db.get("loadMeasures")
                .push(runData)
                .write();
            db.update("loadMeasureCount", n => n + 1).write();
            resolve(runData);
        }),

    getLastResult: testName =>
        new Promise((resolve, _) => {
            const results = db
                .get("loadMeasures")
                .filter({ testName: testName })
                .sortBy("runTime")
                .reverse()
                .take(1)
                .value();

            if (results.length == 0) resolve(null);
            else resolve(results[0]);
        }),

    getMetricTrend: (testName, metric) =>
        new Promise(async (resolve, _) => {
            const results = db
                .get("loadMeasures")
                .filter({ testName: testName })
                .sortBy("runTime")
                .take(20)
                .value();
            results.forEach(e => {
                if (e.timings[metric]) e[metric] = e.timings[metric];
                else if (e.metrics[metric]) e[metric] = e.metrics[metric];
                else if (e.tracing[metric]) e[metric] = e.tracing[metric];
            });
            resolve(results);
        }),

    getRequestTypeTrend: testName =>
        new Promise(async (resolve, _) => {
            const results = db
                .get("loadMeasures")
                .filter({ testName: testName })
                .sortBy("runTime")
                .take(20)
                .value();

            const trends = {};
            results.map(e => {
                const report = e.tracing;
                for (const key of Object.keys(report)) {
                    if (!(key in trends)) trends[key] = [];
                    trends[key].push({
                        id: e.id,
                        runTime: e.runTime,
                        numberRequests: report[key].numberRequests,
                        totalEncodedSize: report[key].totalEncodedSize,
                        totalDecodedSize: report[key].totalDecodedSize,
                        totalRequestDuration: report[key].totalRequestDuration
                    });
                }
                resolve(trends);
            });
        })
};
