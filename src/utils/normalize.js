const mapValuesDeep = (obj, fn) => {
    if (Array.isArray(obj)) return obj.map(item => mapValuesDeep(item, fn));
    if (obj !== null && typeof obj === "object") {
        if (Object.getPrototypeOf(obj) === Object.prototype) {
            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => [k, mapValuesDeep(v, fn)])
            );
        }
        return obj;
    }
    return fn(obj);
};

export const normalizeMetrics = metrics =>
    Object.fromEntries(
        Object.entries(metrics).map(([k, v]) => {
            // Lowercase a leading acronym too: JSHeapUsedSize -> jsHeapUsedSize
            const key = k.replace(/^[A-Z]+(?=[A-Z][a-z]|$)|^[A-Z]/, m => m.toLowerCase());
            return [key, typeof v === "number" ? Math.round(v) : v];
        })
    );

export const deepRound = metrics =>
    mapValuesDeep(metrics, v => (typeof v === "number" ? Math.round(v) : v));

export const averageValues = values => {
    const valid = values.filter(v => v != null);
    if (valid.length === 0) return {};
    const keys = Object.keys(valid[0]);
    return Object.fromEntries(
        keys.map(key => {
            const nums = valid.map(v => v[key]).filter(n => n != null && !Number.isNaN(n));
            return [key, nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0];
        })
    );
};
