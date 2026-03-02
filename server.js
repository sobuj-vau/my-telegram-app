const { Telegraf, Markup } = require('telegraf');
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

const bot = new Telegraf(process.env.BOT_TOKEN);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Database Connected"))
  .catch(err => console.error("❌ DB Connection Error:", err));

// ইউজার স্কিমা (এখানে ভুল ছিল যা ঠিক করা হয়েছে)
const User = mongoose.model('User', {
  telegramId: { type: String, unique: true },
  name: String,
  balance: { type: Number, default: 0 }
});

bot.start(async (ctx) => {
  try {
    const { id, first_name } = ctx.from;
    let user = await User.findOne({ telegramId: id.toString() });
    
    if (!user) {
      user = new User({ telegramId: id.toString(), name: first_name });
      await user.save();
    }
    
    ctx.reply(`👋 স্বাগতম ${first_name}!`, Markup.inlineKeyboard([
      [Markup.button.webApp('অ্যাপ ওপেন করুন 🚀', process.env.APP_URL)]
    ]));
  } catch (error) {
    console.error("Bot Start Error:", error);
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  bot.launch().catch(err => console.error("Bot Launch Error:", err));
});
