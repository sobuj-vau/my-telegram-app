const { Telegraf, Markup } = require('telegraf');
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// ========================
// এনভায়রনমেন্ট ভেরিয়েবল চেক
// ========================
const requiredEnv = ['BOT_TOKEN', 'MONGO_URI', 'APP_URL'];
for (const env of requiredEnv) {
  if (!process.env[env]) {
    console.error(`❌ ${env} সেট করা হয়নি! .env ফাইল চেক করুন।`);
    process.exit(1);
  }
}

// ========================
// এক্সপ্রেস অ্যাপ সেটআপ
// ========================
const app = express();
app.use(cors());
app.use(express.json());
// পুরো ডিরেক্টরি স্ট্যাটিক সার্ভ করছে (index.html সহ)
app.use(express.static(path.join(__dirname, '/')));

// ========================
// বট ইনিশিয়ালাইজ
// ========================
const bot = new Telegraf(process.env.BOT_TOKEN);

// ========================
// মঙ্গুDB সংযোগ
// ========================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ ডাটাবেস সংযুক্ত"))
  .catch(err => {
    console.error("❌ ডাটাবেস সংযোগ ব্যর্থ:", err);
    process.exit(1);
  });

// ========================
// ইউজার মডেল
// ========================
const User = mongoose.model('User', new mongoose.Schema({
  telegramId: { type: String, unique: true },
  name: String,
  balance: { type: Number, default: 0 }
}));

// ========================
// বট কমান্ড হ্যান্ডলার
// ========================

// /start কমান্ড
bot.start(async (ctx) => {
  try {
    const { id, first_name } = ctx.from;
    let user = await User.findOne({ telegramId: id.toString() });
    
    if (!user) {
      user = new User({ telegramId: id.toString(), name: first_name });
      await user.save();
      console.log(`নতুন ইউজার সংরক্ষিত: ${first_name} (${id})`);
    }

    await ctx.reply(
      `👋 স্বাগতম ${first_name}! নিচের বাটনে ক্লিক করে গেম শুরু করুন।`,
      Markup.inlineKeyboard([
        [Markup.button.webApp('🚀 গেম ওপেন করুন', process.env.APP_URL)]
      ])
    );
  } catch (error) {
    console.error("Start কমান্ডে ত্রুটি:", error);
    await ctx.reply("দুঃখিত, একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।");
  }
});

// ওয়েব অ্যাপ থেকে পাঠানো ডেটা হ্যান্ডল করা
bot.on('web_app_data', async (ctx) => {
  try {
    const data = ctx.webAppData.data; // এটি সাধারণত JSON স্ট্রিং হয়
    const parsedData = JSON.parse(data);
    console.log("ওয়েব অ্যাপ থেকে ডেটা:", parsedData);

    // ধরি ওয়েব অ্যাপ থেকে { score: 100 } এরকম ডেটা আসছে
    const { score } = parsedData;
    const telegramId = ctx.from.id.toString();

    // ইউজারের ব্যালেন্স আপডেট
    const user = await User.findOne({ telegramId });
    if (user) {
      user.balance += score || 0;
      await user.save();
      await ctx.reply(`🎉 আপনার স্কোর: ${score}\nবর্তমান ব্যালেন্স: ${user.balance}`);
    } else {
      await ctx.reply("ইউজার পাওয়া যায়নি। /start কমান্ড দিন।");
    }
  } catch (error) {
    console.error("ওয়েব অ্যাপ ডেটা প্রক্রিয়াকরণে ত্রুটি:", error);
    await ctx.reply("ডেটা প্রক্রিয়াকরণে সমস্যা হয়েছে।");
  }
});

// অন্য যেকোনো টেক্সট মেসেজ হ্যান্ডল করা (ঐচ্ছিক)
bot.on('text', (ctx) => {
  ctx.reply('আপনি কি গেম খেলতে চান? /start দিন');
});

// ========================
// এক্সপ্রেস রাউট
// ========================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});// ইউজারের ব্যালেন্স ডাটাবেস থেকে এনে দেখানোর API
app.get('/api/user/:id', async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.id });
    if (user) {
      res.json({ balance: user.balance, name: user.name });
    } else {
      res.status(404).json({ error: "ইউজার পাওয়া যায়নি" });
    }
  } catch (error) {
    res.status(500).json({ error: "সার্ভার এরর" });
  }
});


// ========================
// সার্ভার ও বট চালু করা
// ========================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🌐 ওয়েব সার্ভার চলছে পোর্ট ${PORT}-এ`);
  
  // বট লঞ্চ (লং পোলিং)
  bot.launch()
    .then(() => console.log('🤖 বট চালু হয়েছে (লং পোলিং)'))
    .catch(err => {
      console.error("❌ বট চালু করতে ব্যর্থ:", err);
      process.exit(1);
    });
});

// গ্রেসফুল শাটডাউন
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
