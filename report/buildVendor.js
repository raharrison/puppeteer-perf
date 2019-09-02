const fs = require("fs").promises;

const baseDir = "./report/vendor/";

async function mergefiles(files) {
    return files.reduce(
        async (previous, current) =>
            (await previous) + ((await fs.readFile(baseDir + current)) + "\n"),
        ""
    );
}

async function buildVendor() {
    const items = (await fs.readdir(baseDir)).reverse();
    return {
        vendorCss: await mergefiles(items.filter(e => e.endsWith("css"))),
        vendorJs: await mergefiles(items.filter(e => e.endsWith("js")))
    };
}

module.exports = buildVendor;
