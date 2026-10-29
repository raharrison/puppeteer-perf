function diffNumber(previous, current) {
    if (previous == null) return { current };
    return {
        previous,
        current,
        changePercent:
            previous === 0
                ? (current === 0 ? 0 : null)
                : ((current - previous) / previous) * 100,
    };
}

export function diffMetrics(previous, current) {
    if (previous == null) return { current };
    const diff = {};
    for (const k of Object.keys(current)) {
        if (typeof current[k] === "number") {
            diff[k] = diffNumber(previous[k], current[k]);
        } else if (
            current[k] !== null &&
            typeof current[k] === "object" &&
            !Array.isArray(current[k])
        ) {
            diff[k] = diffMetrics(previous[k], current[k]);
        }
    }
    return diff;
}
