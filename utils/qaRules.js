const qaRules = new Map([
    [/^(hello|hi|hey)$/i, "Hello there! How are you doing?"],
    [/^good (morning|night|evening)$/i, "Good day to you too!"],
    [/^(your name|who are you)$/i, "I am Yeasin's friendly Telegram bot"],
    [/^how are you$/i, "I'm just code, but I feel awesome when you talk to me"],
    [/^(thank(s| you))$/i, "You're most welcome!"],
    [/^(bye|goodbye)$/i, "Goodbye! Take care"],
]);

module.exports = qaRules;
