const Telegraf = require('telegraf'),
  Markup = require('telegraf/markup'),
  Extra = require('telegraf/extra'),
  axios = require('axios'),
  rateLimit = require('telegraf-ratelimit'),
  cheerio = require('cheerio'),
  redis = require('./middleware/redis'),
  session = require('telegraf/session'),
  keys = require('./config/keys'),
  errorLogger = require('./middleware/errorLogger'),
  { Random } = require('random-js'),
  random = new Random(),
  dateFormat = require('dateformat'),
  bot = new Telegraf(keys.telegramBotToken),
  limitConfig = {
    window: 3000,
    limit: 1
  };

bot.use(session());
bot.use(rateLimit(limitConfig));

bot.action('MORE', ctx => {
  let date = generateDate();

  //check redis cache
  redis.lrange(date, 0, -1, (err, result) => {
    if (err) {
      errorLogger.log({
        level: 'error',
        message: `CHAT: ${ctx.from.id}, USERNAME: ${ctx.from.username}, NAME: ${ctx.from.first_name} ${ctx.from.last_name}, ERROR_MSG: ${err.message}`
      });

      return ctx.reply('❌ Произошла ошибка, попробуй еще раз!');
      //cached result found, serving
    }
    if (result.length > 0) {
      img = result[0];
      title = result[1];
      caption = result[2];
      requestUrl = result[3];

      const extra = Extra.markup(
        Markup.inlineKeyboard([Markup.callbackButton('Еще 🚀', 'MORE')])
      );
      extra.caption = `<b>${title}</b>\n\n${caption}\n\n<a href="${requestUrl}">На сайт ↗️</a>`;
      extra.parse_mode = 'HTML';

      return done(ctx.chat.id, img, extra);
      //cached result not found, requesting
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

          //adding to redis cache
          toCache.push(img, title, caption, requestUrl);
          redis.rpush.apply(redis, [`${date}`].concat(toCache));

          extra.caption = `<b>${title}</b>\n\n${caption}\n\n<a href="${requestUrl}">На сайт ↗️</a>`;
          extra.parse_mode = 'HTML';

          return done(ctx.chat.id, img, extra);
        })
        .catch(err => {
          errorLogger.log({
            level: 'error',
            message: `CHAT: ${ctx.from.id}, USERNAME: ${ctx.from.username}, NAME: ${ctx.from.first_name} ${ctx.from.last_name}, ERROR_MSG: ${err.message}`
          });

          return ctx.reply('❌ Произошла ошибка, попробуй еще раз!');
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
    `Привет! Я присылаю случайные публикации из <a href="https://www.artlebedev.ru/kovodstvo/idioteka/">Идиотеки</a>.
Для справки нажми /help.
    `,
    extra
  );
});

bot.help(ctx => {
  const extra = Extra.markup(
    Markup.inlineKeyboard([Markup.callbackButton('Начнем! 🚀', 'MORE')])
  );
  extra.parse_mode = 'HTML';
  extra.webPreview(false);

  ctx.reply(
    `<b>Справка</b>

@idioteka_bot предназначен для получения случайных публикаций из <a href="https://www.artlebedev.ru/kovodstvo/idioteka/">Идиотеки</a>.

Работает в одном режиме – генерации случайной ссылки и получения публикации напрямую с веб-страницы. Скорость получения информации с сайта не зависит от бота и при высоких нагрузках на сайт Идиотеки время получения публикации может увеличиваться.

Бот поддерживает кэширование и все публикации, которые проходят через него, добавляются в кэш. Таким образом, скорость каждой последующей загрузки публикации увеличивается.

⚠️ Количество запросов ограничено одним в каждые три секунды.
     `,
    extra
  );
});

bot.catch(err => {
  console.log(err.message);
  ctx.reply('❌ Произошла ошибка, попробуй еще раз!');
});

function generateDate() {
  let start = new Date(2006, 10, 1);
  let end = new Date();
  let date = random.date(start, end);
  let newdate = dateFormat(date, 'yyyy/mm/dd');
  return newdate;
}

function done(chatId, img, extra) {
  return bot.telegram.sendPhoto(chatId, img, extra);
}

bot.launch();
