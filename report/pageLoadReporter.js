const fs = require("fs");
const diff = require("../utils/diff");
const Handlebars = require("handlebars");

Handlebars.registerHelper("tableRowClass", e => {
    return !e || Math.abs(e) < 5 ? "" : e < 0 ? "table-success " : "table-danger";
});

Handlebars.registerHelper("friendlyName", e =>
    e.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())
);

Handlebars.registerHelper("toPercentBadge", e => {
    const rounded = Math.round(e);
    const value = rounded > 0 ? "+" + rounded : rounded;
    let klass = "badge badge-primary";
    if (e < 0) klass = "badge badge-success";
    else if (e > 0) klass = "badge badge-danger";

    return `<span class="${klass}">${value}%</span>`;
});

const buildTemplate = name => {
    const src = fs.readFileSync(`report/templates/${name}`, "utf8");
    return Handlebars.compile(src);
};

const currentDateStr = () =>
    new Date()
        .toISOString()
        .replace(/:|-|T|\./g, "")
        .slice(0, 14);

function buildRequestTypeComparison(tracingData) {
    const status = {};
    for (k in tracingData) {
        const val = tracingData[k];
        if (val.breakdown) {
            status[k] = {
                largestRequest: null,
                longestRequest: null,
                200: 9,
                500: 2
            };
        }
    }
    return status;
    // Main page load status code
    // Request status codes

    // per mime type:
    // biggest response
    // longest request
    // number per status code
}

function buildComparison(previousTiming, currentTiming, previousTracing, currentTracing) {
    const timingDiff = diff.diffMetrics(previousTiming, currentTiming);
    const tracingDiff = diff.diffMetrics(previousTracing, currentTracing);

    return {
        timingDiff: Object.entries(timingDiff).map(e => ({
            metric: e[0],
            ...e[1]
        })),
        tracingDiff: Object.entries(tracingDiff).map(e => ({
            metric: e[0],
            ...e[1]
        }))
    };
}

function generatePageLoadReport(previousRunData, currentRunData) {
    const res = buildComparison(
        diff.previousTimings,
        diff.currentTimings,
        diff.previousTracing,
        diff.currentTracing
    );
    const template = buildTemplate("pageLoadReportTemplate.html");
    const doc = template(res);
    fs.writeFileSync("generated/output.html", doc);
    // console.log(JSON.stringify(res, null, 2));
}

generatePageLoadReport();
console.log("Done");
