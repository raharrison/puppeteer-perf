import puppeteer from "puppeteer";
import { measurePageLoad } from "./measure/page-load.js";

const url = process.argv[2] || "https://developer.mozilla.org/en-US/";
const testName = process.argv[3] || "mdn-homepage";
const iterations = parseInt(process.argv[4], 10) || 3;

let browser;
try {
    browser = await puppeteer.launch();
    await measurePageLoad(browser, testName, url, iterations);
} catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
} finally {
    if (browser?.connected) await browser.close();
}
