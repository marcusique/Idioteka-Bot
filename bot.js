const Telegraf = require('telegraf'),
  Markup = require('telegraf/markup'),
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
  axios.get(requestUrl).then(html => {
    let $ = cheerio.load(html.data);
    let img = $('div.everiday-page-content-image > a > img').attr('src');
    let title = $('div.als-text-container > p.before_list').text();
    let caption = $('div.als-text-container > p')
      .next()
      .append('\n')
      .text()
      .trim();

    ctx.replyWithPhoto(
      img,
      { caption: `${title}\n${caption}` },
      Markup.inlineKeyboard([
        Markup.urlButton('Grand Prix Report (Wikipedia)', `${requestUrl}`)
      ]).extra()
    );
  });
});

// axios.get(URL).then(html => {
//   let $ = cheerio.load(html.data);
//   let img = $('div.everiday-page-content-image > a > img').attr('src');
//   let title = $('div.als-text-container > p.before_list').text();
//   let caption = $('div.als-text-container > p')
//     .next()
//     .append(' ')
//     .text()
//     .trim();
// });

bot.launch();
