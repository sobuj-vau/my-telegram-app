const { Telegraf, Markup } = require('telegraf');
const mongoose = require('mongoose');
const express = require('express');
const User = require('./models/User'); // মডেল ইম্পোর্ট
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// /start কমান্ড এবং রেফারেল হ্যান্ডলিং
bot.start(async (ctx) => {
  const tgId = ctx.from.id.toString();
  const refId = ctx.startPayload; // ইনভাইট লিঙ্ক থেকে আসা আইডি

  let user = await User.findOne({ telegramId: tgId });

  if (!user) {
    user = new User({ telegramId: tgId, name: ctx.from.first_name });
    
    // যদি কেউ রেফার করে থাকে
    if (refId && refId !== tgId) {
      const referrer = await User.findOne({ telegramId: refId });
      if (referrer) {
        referrer.balance += 5; // ৫ টাকা বোনাস
        referrer.referralCount += 1;
        referrer.referralEarnings += 5;
        await referrer.save();
        user.referredBy = refId;
      }
    }
    await user.save();
  }

  ctx.reply(`স্বাগতম!`, Markup.inlineKeyboard([
    [Markup.button.webApp('🚀 গেম ওপেন করুন', process.env.APP_URL)]
  ]));
});

// API এন্ডপয়েন্ট
app.get('/api/user/:id', async (req, res) => {
  const user = await User.findOne({ telegramId: req.params.id });
  user ? res.json(user) : res.status(404).send('Not Found');
});

app.listen(process.env.PORT || 10000, () => bot.launch());
