const Telegraf = require('telegraf'),
  Markup = require('telegraf/markup'),
  Extra = require('telegraf/extra'),
  axios = require('axios'),
  cheerio = require('cheerio'),
  redis = require('./middleware/redis'),
  session = require('telegraf/session'),
  keys = require('./config/keys'),
  infoLogger = require('./middleware/infoLogger'),
  errorLogger = require('./middleware/errorLogger'),
  functions = require('./functions'),
  bot = new Telegraf(keys.telegramBotToken);

bot.use(session());

bot.action('MORE', ctx => {
  let date = functions.generateDate();

  //check redis cache
  redis.lrange(date, 0, -1, (err, result) => {
    if (err) {
      errorLogger.log({
        level: 'error',
        message: `CHAT: ${ctx.from.id}, USERNAME: ${ctx.from.username}, NAME: ${
          ctx.from.first_name
        } ${ctx.from.last_name}, ERROR_MSG: ${err.message}`
      });

      ctx.reply('❌ Произошла ошибка, попробуй еще раз!');
      //cached result found, serving
    } else if (result.length > 0) {
      img = result[0];
      title = result[1];
      caption = result[2];
      requestUrl = result[3];

      const extra = Extra.markup(
        Markup.inlineKeyboard([Markup.callbackButton('Еще', 'MORE')])
      );
      extra.caption = `<a href="${requestUrl}">${title}</a>\n\n${caption}`;
      extra.parse_mode = 'HTML';

      ctx.replyWithPhoto(img, extra);
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

          extra.caption = `<a href="${requestUrl}">${title}</a>\n\n${caption}`;
          extra.parse_mode = 'HTML';

          ctx.replyWithPhoto(img, extra);
        })
        .catch(err => {
          errorLogger.log({
            level: 'error',
            message: `CHAT: ${ctx.from.id}, USERNAME: ${
              ctx.from.username
            }, NAME: ${ctx.from.first_name} ${ctx.from.last_name}, ERROR_MSG: ${
              err.message
            }`
          });

          ctx.reply('❌ Произошла ошибка, попробуй еще раз!');
        });
    }
  });
  infoLogger.log({
    level: 'info',
    message: `CHAT: ${ctx.from.id}, USERNAME: ${ctx.from.username}, NAME: ${
      ctx.from.first_name
    } ${ctx.from.last_name}`
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

  infoLogger.log({
    level: 'info',
    message: `CHAT: ${ctx.from.id}, USERNAME: ${ctx.from.username}, NAME: ${
      ctx.from.first_name
    } ${ctx.from.last_name}, MESSAGE: ${ctx.message.text}`
  });
});

bot.help(ctx => {
  const extra = Extra.markup(
    Markup.inlineKeyboard([Markup.callbackButton('Начнем! 🚀', 'MORE')])
  );
  extra.parse_mode = 'HTML';
  extra.webPreview(false);

  ctx.reply(
    `<b>Справка</b>

@idioteka_bot предназначен для получения случайных публикаций из <a href="https://www.artlebedev.ru/kovodstvo/idioteka/">Идиотеки</a> Студии Артемия Лебедева.

Работает в одном режиме – генерации случайной ссылки и получения публикации напрямую с веб-страницы. Скорость получения информации с сайта не зависит от бота и при высоких нагрузках на сайт Идиотеки время получения публикации может увеличиваться.

Бот поддерживает кэширование и все публикации, которые проходят через него, добавляются в кэш. Таким образом, скорость каждой последующей загрузки публикации увеличивается.
     `,
    extra
  );
  infoLogger.log({
    level: 'info',
    message: `CHAT: ${ctx.from.id}, USERNAME: ${ctx.from.username}, NAME: ${
      ctx.from.first_name
    } ${ctx.from.last_name}, MESSAGE: ${ctx.message.text}`
  });
});

bot.launch();
