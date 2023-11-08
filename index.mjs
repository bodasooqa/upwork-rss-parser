import 'dotenv/config'
import TelegramBot from "node-telegram-bot-api";
import Parser from 'rss-parser';
import { JSONPreset } from 'lowdb/node';

const defaultData = { links: [] }
const db = await JSONPreset('db.json', defaultData)

const parser = new Parser();

const upworkURL = `${process.env.UPWORK_URL}?`
  + `q=${process.env.UPWORK_QUERY}&` // Query
  + `sort=recency&verified_payment_only=1&paging=0%3B10&api_params=1&` // Filters
  + `securityToken=${process.env.UPWORK_SEQURITY_TOKEN}&userUid=${process.env.UPWORK_USER_UID}&orgUid=${process.env.UPWORK_ORG_UID}`; // Auth

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Hello, I\'m Upwork RSS Bot');
});

const checkForNewLinks = async () => {
  try {
    const feed = await parser.parseURL(upworkURL);
    feed.items.forEach((item) => {
      if (db.data.links.includes(item.link)) return;

      console.log('Written:', item.link);
      db.data.links.push(item.link);

      bot.sendMessage(
        process.env.TELEGRAM_CHAT_ID,
        `<b>${item.title}</b>`
        + '\n\n'
        + `${item['content'].replaceAll('<br />', '\n').replaceAll('\n\n', '\n').replace(/\ {5,10}/g, ' ')}`,
        { parse_mode: 'HTML' }
      );
    });

    db.write();
  } catch (error) {
    console.log('Error:', error);
  }
}

checkForNewLinks();
setInterval(() => checkForNewLinks(), 30000);
