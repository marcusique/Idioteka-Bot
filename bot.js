const Telegraf = require('telegraf'),
  axios = require('axios'),
  cheerio = require('cheerio'),
  keys = require('./config/keys'),
  bot = new Telegraf(keys.telegramBotToken);

bot.start(ctx => {
  ctx.reply('hello');
});

bot.launch();
