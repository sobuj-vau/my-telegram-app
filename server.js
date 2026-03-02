const { Telegraf, Markup } = require('telegraf');
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// index.html ফাইলটি দেখানোর জন্য এই লাইনটি জরুরি
app.use(express.static(path.join(__dirname, '/')));

const bot = new Telegraf(process.env.BOT_TOKEN);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database Connected"))
  .catch(err => console.error("❌ DB Connection Error:", err));

const User = mongoose.model('User', {
  telegramId: String,
  name: String,
  balance: { type: Number, default: 0 }
});

bot.start(async (ctx) => {
  const { id, first_name } = ctx.from;
  let user = await User.findOne({ telegramId: id });
  if (!user) {
    user = new User({ telegramId: id, name: first_name });
    await user.save();
  }
  ctx.reply(`👋 স্বাগতম ${first_name}!`, Markup.inlineKeyboard([
    [Markup.button.webApp('অ্যাপ ওপেন করুন 🚀', process.env.APP_URL)]
  ]));
});

// মূল লিঙ্কে ভিজিট করলে এখন আপনার ডিজাইন করা HTML পেজ দেখাবে
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  bot.launch();
});
