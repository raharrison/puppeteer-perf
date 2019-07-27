const puppeteer = require("puppeteer");
const { measurePageLoad } = require("./measure/measurePageLoad");

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch();
        const url = "https://ryanharrison.co.uk";
        await measurePageLoad(browser, "load-homepage", url);
    } catch (error) {
        console.log("An error occurred: " + error);
    } finally {
        if (browser.isConnected()) await browser.close();
    }
})();
