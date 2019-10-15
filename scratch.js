const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("data.json");
const db = low(adapter);

db.defaults({
    loadMeasures: []
}).write();
const a = db
    .get("loadMeasures")
    .push({ a: 2, b: 1 })
    .write();

console.log(a);
