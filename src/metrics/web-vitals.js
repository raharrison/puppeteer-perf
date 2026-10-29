export async function setupWebVitalsObservers(page) {
    await page.evaluateOnNewDocument(() => {
        window.__webVitals = { lcp: 0, cls: 0, fcp: 0 };

        new PerformanceObserver(list => {
            const entries = list.getEntries();
            if (entries.length) {
                window.__webVitals.lcp = entries[entries.length - 1].startTime;
            }
        }).observe({ type: "largest-contentful-paint", buffered: true });

        new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    window.__webVitals.cls += entry.value;
                }
            }
        }).observe({ type: "layout-shift", buffered: true });

        new PerformanceObserver(list => {
            const fcp = list.getEntries().find(e => e.name === "first-contentful-paint");
            if (fcp) window.__webVitals.fcp = fcp.startTime;
        }).observe({ type: "paint", buffered: true });
    });
}

export async function captureWebVitals(page) {
    return page.evaluate(() => window.__webVitals);
}
