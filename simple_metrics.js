const puppeteer = require("puppeteer");

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setCacheEnabled(false);

    const client = await page.target().createCDPSession();
    await client.send("Performance.enable");

    await page.goto("https://ryanharrison.co.uk", {
        waitUntil: "networkidle0"
    });

    const before = new Date().getTime();
    await page.goto("https://ryanharrison.co.uk", {
        waitUntil: "networkidle0"
    });
    const after = new Date().getTime();

    const timing = JSON.parse(
        await page.evaluate(() => JSON.stringify(window.performance.timing))
    );
    console.log(timing.loadEventEnd - timing.navigationStart);
    console.log(after - before - 500);

    await browser.close();
})();
