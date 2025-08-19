const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const token = process.env.TOKEN;

// Render এর জন্য PUBLIC URL লাগবে (deploy করার পর Render থেকে URL পাবেন)
const url = process.env.RENDER_EXTERNAL_URL || `https://yourapp.onrender.com`;
const bot = new TelegramBot(token, { webHook: true });

// Telegram কে জানানো হবে: নতুন মেসেজ আসলে কোথায় পাঠাতে হবে
bot.setWebHook(`${url}/bot${token}`);

// Express route
app.use(express.json());

// Telegram এর webhook endpoint
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Q/A Database
const qaDatabase = [
  { question: 'hello', answer: 'Hello! How can I help you today? 😊' },
  { question: 'hi', answer: 'Hi there! What’s up? 😄' },
  { question: 'your name', answer: 'I am Yeasin’s friendly Telegram bot 🤖' },
  { question: 'how are you', answer: 'I am just code, but feeling awesome! 😎' },
  { question: 'bye', answer: 'Goodbye! Have a great day! 👋' }
];

// মেসেজ হ্যান্ডলার
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

// Render-এ সার্ভার চালু
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
