const DURATION_FIELDS = [
    "LayoutDuration",
    "RecalcStyleDuration",
    "ScriptDuration",
    "TaskDuration",
];

const MEASURE_FIELDS = [
    "Documents",
    "JSEventListeners",
    "Nodes",
    "LayoutCount",
    "RecalcStyleCount",
    "JSHeapUsedSize",
];

export async function captureChromeMetrics(client) {
    const { metrics } = await client.send("Performance.getMetrics");
    const get = name => metrics.find(m => m.name === name)?.value ?? 0;

    const durations = {};
    for (const field of DURATION_FIELDS) {
        durations[field] = get(field) * 1000; // seconds → ms
    }

    const measures = {};
    for (const field of MEASURE_FIELDS) {
        measures[field] = get(field);
    }

    return { durations, measures };
}
