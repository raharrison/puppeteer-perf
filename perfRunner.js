const puppeteer = require("puppeteer");
const { measurePageLoad } = require("./measure/measurePageLoad");

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch();
        const url = "https://ryanharrison.co.uk";
        await measurePageLoad(browser, "load-homepage", url, 3);
    } catch (error) {
        console.log("An error occurred: " + error);
        console.log(error.stack);
    } finally {
        if (browser.isConnected()) await browser.close();
    }
})();
