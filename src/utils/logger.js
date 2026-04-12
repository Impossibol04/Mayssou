function ts() {
    return new Date().toISOString();
}

function fmt(level, msg, meta) {
    const m = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${ts()}] [${level}] ${msg}${m}`;
}

module.exports = {
    info(msg, meta) {
        console.log(fmt('INFO', msg, meta));
    },
    warn(msg, meta) {
        console.warn(fmt('WARN', msg, meta));
    },
    error(msg, meta) {
        console.error(fmt('ERROR', msg, meta));
    },
};
