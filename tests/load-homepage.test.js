const puppeteer = require("puppeteer");
const { measurePageLoad } = require("../measure/measurePageLoad");

let browser;

beforeAll(async () => {
    console.log("Opening browser");
    browser = await puppeteer.launch();
});

afterAll(async () => {
    console.log("Closing browser");
    if (browser && browser.isConnected()) await browser.close();
});

describe("Load Homepage", () => {
    let runData;
    beforeAll(async () => {
        const url = "https://ryanharrison.co.uk";
        runData = await measurePageLoad(browser, "load-homepage", url);
    });

    test("full page load should be within 1 second", () => {
        expect(runData.timings.fullTime).toBeLessThan(1000);
    });

    it("should have less than 1500 nodes", () => {
        expect(runData.metrics.nodes).toBeLessThan(1500);
    });
});
