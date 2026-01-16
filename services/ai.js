const OpenAI = require('openai');
const env = require('../config/env');

const openai = new OpenAI({
    apiKey: env.geminiApiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/models/"
});

async function getAIResponse(prompt, mediaBase64 = null) {
    try {
        const userContent = [{ type: 'text', text: prompt }];
        if (mediaBase64) {
            userContent.push({
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${mediaBase64}` }
            });
        }

        const res = await openai.chat.completions.create({
            model: 'gemini-1.5-flash',
            messages: [
                {
                    role: 'system',
                    content: 'You are a friendly and helpful Telegram bot assistant.'
                },
                { role: 'user', content: userContent }
            ],
            stream: true
        });

        let fullResponse = '';
        for await (const chunk of res) {
            if (chunk.choices[0]?.delta?.content) {
                fullResponse += chunk.choices[0].delta.content;
            }
        }

        return fullResponse.trim() || "Sorry, I couldn't process your request.";
    } catch (error) {
        console.error(error);
        return "Sorry, an error occurred. Please try again in a moment.";
    }
}

module.exports = {
    getAIResponse
};
