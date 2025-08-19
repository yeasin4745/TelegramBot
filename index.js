const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const token = process.env.TOKEN;

// Render এর জন্য PUBLIC URL 
const url = process.env.RENDER_EXTERNAL_URL ;
const bot = new TelegramBot(token, { webHook: true });

bot.setWebHook(`${url}/bot${token}`);

// Express route
app.use(express.json());

// Telegram এর webhook endpoint
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});


const qaRules = [
  { pattern: /hello|hi|hey/i, answer: "Hello there! 👋 How are you doing?" },
  { pattern: /good (morning|night|evening)/i, answer: "Good day to you too! 🌸" },
  { pattern: /your name|who are you/i, answer: "I am Yeasin’s friendly Telegram bot 🤖" },
  { pattern: /how are you/i, answer: "I’m just code, but I feel awesome when you talk to me 😎" },
  { pattern: /thank(s| you)/i, answer: "You’re most welcome! 🙏" },
  { pattern: /bye|goodbye/i, answer: "Goodbye! Take care 👋" },
  { pattern: /study|learning/i, answer: "Learning is the key to success 📚 Keep going!" },
  { pattern: /motivate|inspire/i, answer: "Believe in yourself 🌟 You can achieve anything!" },
  { pattern: /get|getting/i, answer: "What are you trying to get? 🤔 I can try to help." },
];

// মেসেজ হ্যান্ডলার
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text?.toLowerCase();

  if (!userMessage) return;

  // Rule match খোঁজা
  const match = qaRules.find(rule => rule.pattern.test(userMessage));

  if (match) {
    bot.sendMessage(chatId, match.answer);
  } else {
    
    bot.sendMessage(chatId, "I don’t know this yet 😔 আমি এখনো কিছু জানি না, আমি মাত্র শিখতেছি 📖");
  }
});

// Render-এ সার্ভার চালু
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
