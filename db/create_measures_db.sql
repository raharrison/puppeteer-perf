CREATE TABLE "load_measure"
(
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
  "testName" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "runTime" INTEGER NOT NULL,

  "domInteractive" REAL,
  "domContentLoaded" REAL,
  "fullTime" REAL,

  "firstMeaningfulPaint" REAL,
  "layoutDuration" REAL,
  "recalcStyleDuration" REAL,
  "scriptDuration" REAL,
  "taskDuration" REAL,

  "documents" INTEGER,
  "jSEventListeners" INTEGER,
  "nodes" INTEGER,
  "layoutCount" INTEGER,
  "recalcStyleCount" INTEGER,
  "jSHeapUsedSize" INTEGER,

  "timingsReport" TEXT,

  "numberRequests" INTEGER,
  "totalEncodedSize" REAL,
  "totalDecodedSize" REAL,
  "totalRequestDuration" REAL,
  "requestsReport" TEXT
);
