const _ = require("lodash/object");
const deepMap = require("deep-map");

const normalizeMetrics = metrics => {
    return _.transform(metrics, (r, v, k) => {
        const lowerKey = k.charAt(0).toLowerCase() + k.slice(1);
        if (typeof v === "number") r[lowerKey] = Math.round(v);
        else r[lowerKey] = v;
    });
};

const deepRound = metrics => {
    return deepMap(metrics, v => {
        if (typeof v === "number") return Math.round(v);
        else return v;
    });
};

module.exports = {
    normalizeMetrics,
    deepRound
};
