const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config()

const token = process.env.TOKEN;

// polling চালু
const bot = new TelegramBot(token, { polling: true });

// প্রশ্ন-উত্তর ডাটাবেস
const qaDatabase = [
  { question: 'hello', answer: 'Hello! How can I help you today? 😊' },
  { question: 'hi', answer: 'Hi there! What’s up? 😄' },
  { question: 'your name', answer: 'I am Yeasin’s friendly Telegram bot 🤖' },
  { question: 'how are you', answer: 'I am just code, but feeling awesome! 😎' },
  { question: 'bye', answer: 'Goodbye! Have a great day! 👋' }
];

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text?.toLowerCase();

  const match = qaDatabase.find(item => userMessage.includes(item.question));

  if (match) {
    bot.sendMessage(chatId, match.answer);
  } else {
    bot.sendMessage(chatId, "Sorry, I don't know the answer to that yet. 😔");
  }
});
