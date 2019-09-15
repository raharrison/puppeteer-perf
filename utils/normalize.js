const { map, isArray, isObject, isPlainObject, mapValues, transform } = require("lodash");

const mapValuesDeep = (obj, fn, key) =>
    isArray(obj)
        ? map(obj, (innerObj, idx) => mapValuesDeep(innerObj, fn, idx))
        : isPlainObject(obj)
        ? mapValues(obj, (val, key) => mapValuesDeep(val, fn, key))
        : isObject(obj)
        ? obj
        : fn(obj, key);

const normalizeMetrics = metrics => {
    return transform(metrics, (r, v, k) => {
        const lowerKey = k.charAt(0).toLowerCase() + k.slice(1);
        if (typeof v === "number") r[lowerKey] = Math.round(v);
        else r[lowerKey] = v;
    });
};

const deepRound = metrics => {
    return mapValuesDeep(metrics, v => {
        if (typeof v === "number") return Math.round(v);
        else return v;
    });
};

const averageValues = values => {
    const result = {};
    if (values.length == 0) return values;
    const keys = Object.keys(values[0]);
    for (const key of keys) {
        let sum = 0;
        for (const val of values) {
            sum += val[key];
        }
        result[key] = sum / values.length;
    }
    return result;
};

module.exports = {
    normalizeMetrics,
    deepRound,
    averageValues
};
