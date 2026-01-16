const axios = require('axios');

async function downloadFile(bot, fileId) {
    try {
        const fileUrl = await bot.getFileLink(fileId);
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data).toString('base64');
    } catch (error) {
        console.error(error);
        throw new Error("Failed to download file");
    }
}

module.exports = {
    downloadFile
};
