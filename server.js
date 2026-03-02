const { Telegraf, Markup } = require('telegraf');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const bot = new Telegraf(process.env.BOT_TOKEN);

// MongoDB কানেকশন
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database Connected"))
  .catch(err => console.error("❌ DB Connection Error:", err));

// ইউজার স্কিমা
const User = mongoose.model('User', {
  telegramId: { type: String, unique: true },
  name: String,
  balance: { type: Number, default: 0 },
  level: { type: Number, default: 0 }
});

// বোট স্টার্ট কমান্ড
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

// সার্ভার পোর্ট (Render-এর জন্য)
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('Server is running...'));

app.listen(PORT, () => {
  console.log(`Server live on port ${PORT}`);
  bot.launch();
});
