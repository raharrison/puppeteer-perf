const metrics = {
    navigationStart: 1563638488119,
    unloadEventStart: 0,
    unloadEventEnd: 0,
    redirectStart: 0,
    redirectEnd: 0,
    fetchStart: 1563638488119,
    domainLookupStart: 1563638488140,
    domainLookupEnd: 1563638488141,
    connectStart: 1563638488141,
    connectEnd: 1563638488234,
    secureConnectionStart: 1563638488164,
    requestStart: 1563638488234,
    responseStart: 1563638488263,
    responseEnd: 1563638488265,
    domLoading: 1563638488267,
    domInteractive: 1563638488487,
    domContentLoadedEventStart: 1563638488488,
    domContentLoadedEventEnd: 1563638488488,
    domComplete: 1563638488622,
    loadEventStart: 1563638488622,
    loadEventEnd: 1563638488622
};

Object.values(metrics).forEach(e =>
    console.log(metrics.domContentLoadedEventEnd - e)
);
