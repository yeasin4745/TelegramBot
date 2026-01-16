const express = require('express');
const router = express.Router();
const { bot } = require('../bot/core');
const env = require('../config/env');

router.post(`/${env.token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

module.exports = router;
