const sqlite3 = require("sqlite3").verbose();
const DB_PATH = "./data.db";

const openConnection = () =>
    new Promise((resolve, reject) => {
        let db = new sqlite3.Database(DB_PATH, err => {
            if (err) return reject(err.message);
        });

        resolve(db);
    });

const closeConnection = db =>
    new Promise((resolve, reject) => {
        db.close(err => {
            if (err) return reject(err.message);
        });

        resolve();
    });

module.exports = {
    reportData: runData =>
        new Promise(async (resolve, reject) => {
            let db = await openConnection();

            const sql = `INSERT INTO load_measure(
                testName, 
                url, 
                runTime,
                domInteractive, 
                domContentLoaded, 
                fullTime, 
                firstMeaningfulPaint, 
                layoutDuration, 
                recalcStyleDuration, 
                scriptDuration, 
                taskDuration,
                documents, 
                jSEventListeners, 
                nodes,
                layoutCount, 
                recalcStyleCount, 
                jSHeapUsedSize, 
                timingsReport,

                numberRequests, 
                totalEncodedSize, 
                totalDecodedSize, 
                totalRequestDuration, 
                requestsReport)
                VALUES (
                ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
            )`;

            const { timings, tracing } = runData;
            const values = [
                runData.testName,
                runData.url,
                runData.runTime,
                timings.domInteractive,
                timings.domContentLoaded,
                timings.fullTime,
                timings.firstMeaningfulPaint,
                timings.layoutDuration,
                timings.recalcStyleDuration,
                timings.scriptDuration,
                timings.taskDuration,
                timings.documents,
                timings.jSEventListeners,
                timings.nodes,
                timings.layoutCount,
                timings.recalcStyleCount,
                timings.jSHeapUsedSize,
                JSON.stringify(timings),

                tracing.numberRequests,
                tracing.totalEncodedSize,
                tracing.totalDecodedSize,
                tracing.totalRequestDuration,
                JSON.stringify(tracing)
            ];

            db.run(sql, values, function(err) {
                if (err) return reject(err.message);
                runData.id = this.lastID;
                resolve(runData); // merge stats with the new generated ID.
            });

            await closeConnection(db);
        }),

    getLastResult: testName =>
        new Promise(async (resolve, reject) => {
            let db = await openConnection();
            db.get(
                `SELECT * FROM load_measure WHERE testName = ? ORDER BY runTime DESC LIMIT 1`,
                testName,
                (err, row) => {
                    if (err) return reject(err.message);
                    if (!row) return row;

                    resolve({
                        id: row.id,
                        testName: row.testName,
                        url: row.url,
                        runTime: row.runTime,
                        timings: JSON.parse(row.timingsReport),
                        tracing: JSON.parse(row.requestsReport)
                    });
                }
            );

            await closeConnection(db);
        })
};
