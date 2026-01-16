function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function isValidText(text) {
    return text && text.trim().length > 0;
}

function isCommand(text) {
    return text && text.startsWith('/');
}

module.exports = {
    isValidUrl,
    isValidText,
    isCommand
};
