class AIService {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async generateResponse(prompt) {
        const response = await fetch('https://api.gemini.com/v1/ai/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.response;
    }
}

module.exports = AIService;