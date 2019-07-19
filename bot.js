const Telegraf = require('telegraf'),
  Markup = require('telegraf/markup'),
  Extra = require('telegraf/extra'),
  axios = require('axios'),
  cheerio = require('cheerio'),
  { Random } = require('random-js'),
  random = new Random(),
  dateFormat = require('dateformat'),
  keys = require('./config/keys'),
  bot = new Telegraf(keys.telegramBotToken);

function generateDate() {
  let start = new Date(2006, 10, 1);
  let end = new Date();
  let date = random.date(start, end);
  let newdate = dateFormat(date, 'yyyy/mm/dd');
  return newdate;
}

bot.start(ctx => {
  let requestUrl = `${keys.URL}${generateDate()}`;
  const extra = Extra.markup(
    Markup.inlineKeyboard([Markup.urlButton('На сайт ↗️', requestUrl)])
  );
  axios.get(requestUrl).then(html => {
    let $ = cheerio.load(html.data);
    let img = $('div.everiday-page-content-image > a > img').attr('src');
    let title = $('div.als-text-container > p.before_list').text();
    let caption = $('div.als-text-container > p')
      .next()
      .append('\n')
      .text()
      .trim();

    extra.caption = `<b>${title}</b>\n\n${caption}`;
    extra.parse_mode = 'HTML';

    ctx.replyWithPhoto(img, extra);
  });
});

bot.launch();
