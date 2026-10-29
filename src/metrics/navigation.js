export async function captureNavigationTimings(page) {
    return page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0];
        if (!nav) return null;
        return {
            ttfb: nav.responseStart,
            domInteractive: nav.domInteractive,
            domContentLoaded: nav.domContentLoadedEventEnd,
            domComplete: nav.domComplete,
            fullTime: nav.loadEventEnd,
        };
    });
}
