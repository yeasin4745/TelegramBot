const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
let OpenAI=require('openai')

const token = process.env.TOKEN;
const port = process.env.PORT || 3000;
const url = process.env.RENDER_EXTERNAL_URL;
const geminiApiKey = process.env.GEMINI_API_KEY;

const app = express();
app.use(express.json());

const bot = new TelegramBot(token);
bot.setWebHook(`${url}/bot${token}`);

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Store for user request limits
const userLimits = {};
const DAILY_LIMIT = 5;
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

function escapeMarkdownV2(text) {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

async function getGeminiResponse(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Error fetching from Gemini:", error);
    return "দুঃখিত, এই মুহূর্তে আমি উত্তর দিতে পারছি না। 😔";
  }
}

async function sendLongMessage(chatId, text, options) {
  const CHUNK_SIZE = 4096;
  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    const chunk = text.substring(i, Math.min(i + CHUNK_SIZE, text.length));
    await bot.sendMessage(chatId, chunk, options);
  }
}




async function aiResponse(prompt,id){

const openai = new OpenAI({                               apiKey: geminiApiKey,                                      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
 });

const res = await openai.chat.completions.create({                                        model: 'models/gemini-1.5-flash-002',                                                   messages: [
    {
      role: 'system',
      content: 'You are a telegram bot ai assistant . I am made by Google. ',
    },
    { role: 'user', content: prompt },
  ],
stream: true
});

for await (const chunk of completion) {
bot.sendMessage(id,chunk.choices[0].message.content);
}
 bot.sendMessage(id,"Do you have any questions?");
}
}



const qaRules = [
  { pattern: /(hello|hi|hey)/i, answer: "Hello there! 👋 How are you doing?" },
  { pattern: /good (morning|night|evening)/i, answer: "Good day to you too! 🌸" },
  { pattern: /(your name|who are you)/i, answer: "I am Yeasin’s friendly Telegram bot 🤖" },
  { pattern: /how are you/i, answer: "I’m just code, but I feel awesome when you talk to me 😎" },
  { pattern: /(thank(s| you))/i, answer: "You’re most welcome! 🙏" },
  { pattern: /(bye|goodbye)/i, answer: "Goodbye! Take care 👋" },
  { pattern: /(study|learning)/i, answer: "Learning is the key to success 📚 Keep going!" },
  { pattern: /(motivate|inspire)/i, answer: "Believe in yourself 🌟 You can achieve anything!" },
];

app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name || "User";
  const welcomeMessage = `👋 Welcome ${name}!
I am Yeasin’s friendly Telegram bot 🤖
You can say hello, ask me questions, or just chat casually.
Let’s get started! 🚀`;
  bot.sendMessage(chatId, welcomeMessage);
});

qaRules.forEach(rule => {
  bot.onText(rule.pattern, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, rule.answer);
  });
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  if (msg.text && (msg.text.startsWith('/') || qaRules.some(rule => rule.pattern.test(userMessage)))) {
    return;
  }

  // Rate Limiting Logic
  const now = Date.now();
  if (!userLimits[chatId]) {
    userLimits[chatId] = {
      count: 0,
      lastRequestTime: now
    };
  }

  const user = userLimits[chatId];
  if (now - user.lastRequestTime > ONE_DAY_IN_MS) {
    user.count = 0;
    user.lastRequestTime = now;
  }
  
  if (user.count >= DAILY_LIMIT) {
    const nextRequestTime = new Date(user.lastRequestTime + ONE_DAY_IN_MS);
    bot.sendMessage(chatId, `Your daily limit has been reach ${nextRequestTime.toLocaleString('bn-BD')} try `);
    return;
  }

  user.count++;
   
  bot.sendChatAction(chatId, 'typing');
  
 aiResponse(chatID,userMessage);
   
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});