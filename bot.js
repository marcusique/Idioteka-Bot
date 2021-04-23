const Telegraf = require('telegraf'),
  Markup = require('telegraf/markup'),
  Extra = require('telegraf/extra'),
  axios = require('axios'),
  infoLogger = require('./middleware/infoLogger'),
  errorLogger = require('./middleware/errorLogger'),
  rateLimit = require('telegraf-ratelimit'),
  limitConfig = {
    window: 3000,
    limit: 1,
  },
  cheerio = require('cheerio'),
  session = require('telegraf/session'),
  keys = require('./config/keys'),
  lib = require('./middleware/lib'),
  bot = new Telegraf(keys.telegramBotToken);

bot.use(session());
bot.use(rateLimit(limitConfig));

bot.action('MORE', (ctx) => {
  const date = lib.generateDate();
  const requestUrl = `${keys.URL}${date}`;
  axios
    .get(requestUrl)
    .then((html) => {
      const $ = cheerio.load(html.data);
      const img = $('div.everiday-page-content-image > a > img').attr('src');
      const title = $('div.als-text-container > p.before_list').text();
      const caption = $('div.als-text-container > p').next().append('\n').text().trim();
      const extra = Extra.markup(Markup.inlineKeyboard([Markup.callbackButton('Еще 🚀', 'MORE')]));

      extra.caption = `<b>${title}</b>\n\n${caption}\n\n<a href="${requestUrl}">На сайт</a> ↗️`;
      extra.parse_mode = 'HTML';

      return done(ctx.chat.id, img, extra);
    })
    .catch((err) => {
      errorLogger.log({
        level: 'error',
        message: `CHAT: ${ctx.from.id}, USERNAME: ${ctx.from.username}, NAME: ${ctx.from.first_name} ${ctx.from.last_name}, ERROR_MSG: ${err.message} DATE: ${lib.returnDate(
          ctx.update.callback_query.message.date
        )}`,
      });
      return ctx.reply('❌ Произошла ошибка, попробуй еще раз!');
    });
});

bot.start((ctx) => {
  const extra = Extra.markup(Markup.inlineKeyboard([Markup.callbackButton('Начнем! 🚀', 'MORE')]));
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
    message: `CHAT: ${ctx.from.id}, USERNAME: ${ctx.from.username}, NAME: ${ctx.from.first_name} ${ctx.from.last_name}, MESSAGE: ${ctx.message.text}, DATE: ${lib.returnDate(
      ctx.message.date
    )}`,
  });
});

bot.help((ctx) => {
  const extra = Extra.markup(Markup.inlineKeyboard([Markup.callbackButton('Начнем! 🚀', 'MORE')]));
  extra.parse_mode = 'HTML';
  extra.webPreview(false);

  ctx.reply(
    `<b>Справка</b>

@idioteka_bot предназначен для получения случайных публикаций из <a href="https://www.artlebedev.ru/kovodstvo/idioteka/">Идиотеки</a>.

Работает в одном режиме – генерации случайной ссылки и получения публикации напрямую с веб-страницы. Скорость получения информации с сайта не зависит от бота и при высоких нагрузках на сайт Идиотеки время получения публикации может увеличиваться.

⚠️ Количество запросов ограничено одним в каждые три секунды.
     `,
    extra
  );
  infoLogger.log({
    level: 'info',
    message: `CHAT: ${ctx.from.id}, USERNAME: ${ctx.from.username}, NAME: ${ctx.from.first_name} ${ctx.from.last_name}, MESSAGE: ${ctx.message.text}, DATE: ${lib.returnDate(
      ctx.message.date
    )}`,
  });
});

bot.catch((err) => {
  console.log(err.message);
  ctx.reply('❌ Произошла ошибка, попробуй еще раз!');
});

function done(chatId, img, extra) {
  return bot.telegram.sendPhoto(chatId, img, extra);
}

bot.launch();
