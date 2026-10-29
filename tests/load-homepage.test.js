import { describe, test, it, expect, beforeAll, afterAll } from "vitest";
import puppeteer from "puppeteer";
import { measurePageLoad } from "../src/measure/page-load.js";

let browser;

beforeAll(async () => {
    browser = await puppeteer.launch();
});

afterAll(async () => {
    if (browser?.connected) await browser.close();
});

describe("MDN Homepage", () => {
    let runData;

    beforeAll(async () => {
        runData = await measurePageLoad(
            browser,
            "mdn-homepage",
            "https://developer.mozilla.org/en-US/",
            3
        );
    });

    test("full page load should be within 5 seconds", () => {
        expect(runData.timings.fullTime).toBeLessThan(5000);
    });

    test("LCP should be within 3 seconds", () => {
        expect(runData.timings.lcp).toBeLessThan(3000);
    });

    test("FCP should be within 2 seconds", () => {
        expect(runData.timings.fcp).toBeLessThan(2000);
    });

    it("should have less than 3500 DOM nodes", () => {
        expect(runData.metrics.nodes).toBeLessThan(3500);
    });

    it("should have minimal layout shift", () => {
        expect(runData.metrics.cls).toBeLessThan(0.25);
    });
});
