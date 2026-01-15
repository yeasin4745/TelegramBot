const LOG_LEVELS = {
    INFO: 'INFO',
    ERROR: 'ERROR',
    WARN: 'WARN',
    DEBUG: 'DEBUG',
};

function log(level, message) {
    const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (LOG_LEVELS[level]) {
        console.log(`[${currentTime}] [${LOG_LEVELS[level]}] ${message}`);
    } else {
        console.log(`[${currentTime}] [UNKNOWN] ${message}`);
    }
}

module.exports = { log, LOG_LEVELS };