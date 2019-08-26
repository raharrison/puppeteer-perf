function diffNumber(previous, current) {
    if (previous == null) return { current: current };
    return {
        previous: previous,
        current: current,
        changePercent: ((current - previous) / previous) * 100
    };
}

function diffMetrics(previous, current) {
    if (previous == null) return { current: current };
    const diff = {};
    Object.keys(current).forEach(k => {
        if (typeof current[k] === "number") {
            diff[k] = diffNumber(previous[k], current[k]);
        } else if (typeof current[k] === "object" && !(current[k] instanceof Array)) {
            diff[k] = diffMetrics(previous[k], current[k]);
        }
    });
    return diff;
}

module.exports = {
    diffMetrics
};
