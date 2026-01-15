'use strict';

class QAService {
    constructor() {
        this.patterns = {};
    }

    addPattern(question, answer) {
        this.patterns[question] = answer;
    }

    getAnswer(question) {
        return this.patterns[question] || 'I am sorry, I do not understand the question.';
    }
}

module.exports = QAService;