const Telegraf = require('telegraf'),
  Markup = require('telegraf/markup'),
  Extra = require('telegraf/extra'),
  axios = require('axios'),
  cheerio = require('cheerio'),
  redis = require('./middleware/redis'),
  session = require('telegraf/session'),
  { Random } = require('random-js'),
  random = new Random(),
  dateFormat = require('dateformat'),
  keys = require('./config/keys'),
  bot = new Telegraf(keys.telegramBotToken);

bot.use(session());

bot.action('MORE', ctx => {
  let date = generateDate();

  redis.lrange(date, 0, -1, (err, result) => {
    if (err) {
      console.log(err);
    } else if (result.length > 0) {
      img = result[0];
      title = result[1];
      caption = result[2];

      const extra = Extra.markup(
        Markup.inlineKeyboard([Markup.callbackButton('Еще', 'MORE')])
      );
      extra.caption = `<b>${title}</b>\n\n${caption}`;
      extra.parse_mode = 'HTML';

      ctx.replyWithPhoto(img, extra);
    } else {
      let toCache = [];
      let requestUrl = `${keys.URL}${date}`;
      const extra = Extra.markup(
        Markup.inlineKeyboard([Markup.callbackButton('Еще! 🚀', 'MORE')])
      );

      axios
        .get(requestUrl)
        .then(html => {
          let $ = cheerio.load(html.data);
          let img = $('div.everiday-page-content-image > a > img').attr('src');
          let title = $('div.als-text-container > p.before_list').text();
          let caption = $('div.als-text-container > p')
            .next()
            .append('\n')
            .text()
            .trim();

          toCache.push(img, title, caption);
          redis.rpush.apply(redis, [`${date}`].concat(toCache));
          extra.caption = `<b>${title}</b>\n\n${caption}`;
          extra.parse_mode = 'HTML';

          ctx.replyWithPhoto(img, extra);
        })
        .catch(err => {
          console.log(err);
          ctx.reply('❌ Произошла ошибка, попробуй еще раз!');
        });
    }
  });
});

bot.start(ctx => {
  const extra = Extra.markup(
    Markup.inlineKeyboard([Markup.callbackButton('Начнем! 🚀', 'MORE')])
  );
  extra.parse_mode = 'HTML';
  extra.webPreview(false);

  ctx.reply(
    'Привет! Я присылаю рандомные публикации из <a href="https://www.artlebedev.ru/kovodstvo/idioteka/">Идиотеки</a> Студии Артемия Лебедева. Поехали!',
    extra
  );
});

bot.help(ctx => {
  const extra = Extra.markup(
    Markup.inlineKeyboard([Markup.callbackButton('Начнем! 🚀', 'MORE')])
  );
  ctx.reply(
    'Я присылаю рандомные публикации из Идиотеки. Просто жми кнопку "Еще 🚀" и я буду присылать тебе публикации 👍🏻',
    extra
  );
});

function generateDate() {
  let start = new Date(2006, 10, 1);
  let end = new Date();
  let date = random.date(start, end);
  let newdate = dateFormat(date, 'yyyy/mm/dd');
  return newdate;
}

bot.launch();
