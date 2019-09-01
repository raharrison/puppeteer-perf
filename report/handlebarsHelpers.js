const Handlebars = require("handlebars");

Handlebars.registerHelper("limit", (e, max) => e && e.slice(0, max || 100));

Handlebars.registerHelper("tableRowClass", e => {
    return !e || Math.abs(e) < 4 ? "" : e < 0 ? "table-success " : "table-danger";
});

Handlebars.registerHelper("friendlyName", e => {
    if (e.length <= 3) return e.toUpperCase();
    return e.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
});

Handlebars.registerHelper("toPercentBadge", e => {
    const rounded = Math.round(e);
    const value = rounded > 0 ? "+" + rounded : rounded;
    let klass = "badge badge-primary";
    if (rounded < 0) klass = "badge badge-success";
    else if (rounded > 0) klass = "badge badge-danger";

    return `<span class="${klass}">${value}%</span>`;
});

Handlebars.registerHelper("dateFormat", t => {
    const date = new Date(t);
    return (
        `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()} ` +
        date.toLocaleTimeString()
    );
});

Handlebars.registerHelper("urlPath", t => {
    if (!t) return t;
    const url = new URL(t);
    return (url.pathname + url.search).slice(0, 85);
});
