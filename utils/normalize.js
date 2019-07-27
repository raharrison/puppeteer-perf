const _ = require("lodash/object");
const deepMap = require("deep-map");

const round = num => Math.round(num * 1000) / 1000;

const normalizeMetrics = metrics => {
    return _.transform(metrics, (r, v, k) => {
        const lowerKey = k.charAt(0).toLowerCase() + k.slice(1);
        if (typeof v === "number") r[lowerKey] = round(v);
        else r[lowerKey] = v;
    });
};

const deepRound = metrics => {
    return deepMap(metrics, v => {
        if (typeof v === "number") return round(v);
        else return v;
    });
};

module.exports = {
    normalizeMetrics,
    deepRound,
    round
};
