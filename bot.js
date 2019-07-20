const Telegraf = require('telegraf'),
  Markup = require('telegraf/markup'),
  Extra = require('telegraf/extra'),
  axios = require('axios'),
  cheerio = require('cheerio'),
  redis = require('./middleware/redis'),
  { Random } = require('random-js'),
  random = new Random(),
  dateFormat = require('dateformat'),
  keys = require('./config/keys'),
  infoLogger = require('./middleware/infoLogger'),
  errorLogger = require('./middleware/errorLogger'),
  bot = new Telegraf(keys.telegramBotToken);

multi = redis.multi();

bot.action('MORE', ctx => {
  let date = generateDate();

  redis.lrange(date, 0, -1, (err, result) => {
    if (err) {
      console.log(err);

      errorLogger.log({
        level: 'error',
        message: `CHAT: ${ctx.from.id}, USERNAME: ${ctx.from.username}, NAME: ${
          ctx.from.first_name
        } ${ctx.from.last_name}, MESSAGE_ID: ${
          ctx.message.message_id
        }, MESSAGE: ${ctx.message.text}, TG_DATE: ${
          ctx.message.date
        }, ERROR_MESSAGE: ${err.message}`
      });

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
        Markup.inlineKeyboard([Markup.callbackButton('Еще', 'MORE')])
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
          errorLogger.log({
            level: 'error',
            message: `CHAT: ${ctx.from.id}, USERNAME: ${
              ctx.from.username
            }, NAME: ${ctx.from.first_name} ${
              ctx.from.last_name
            }, MESSAGE_ID: ${ctx.message.message_id}, MESSAGE: ${
              ctx.message.text
            }, TG_DATE: ${ctx.message.date}, ERROR_MESSAGE: ${err.message}`
          });

          ctx.reply('❌ Произошла ошибка, попробуй еще раз!');
        });
    }
  });
});

bot.start(ctx => {
  const extra = Extra.markup(
    Markup.inlineKeyboard([Markup.callbackButton('Еще', 'MORE')])
  );
  ctx.reply('Начнем, пожалуй!', extra);

  infoLogger.log({
    level: 'info',
    message: `CHAT: ${ctx.from.id}, USERNAME: ${ctx.from.username}, NAME: ${
      ctx.from.first_name
    } ${ctx.from.last_name}, MESSAGE_ID: ${ctx.message.message_id}, MESSAGE: ${
      ctx.message.text
    }, TG_DATE: ${ctx.message.date}`
  });
});

bot.help(ctx => {
  ctx.reply();
});

function generateDate() {
  let start = new Date(2006, 10, 1);
  let end = new Date();
  let date = random.date(start, end);
  let newdate = dateFormat(date, 'yyyy/mm/dd');
  return newdate;
}

bot.launch();
