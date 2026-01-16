function handleStart(msg) {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || "User";
    const welcomeMessage = `Welcome ${name}!\nI am Yeasin's friendly Telegram bot\nYou can send me text messages, photos, or videos for analysis. Let's get started!`;
    this.sendMessage(chatId, welcomeMessage);
}

module.exports = {
    handleStart
};
