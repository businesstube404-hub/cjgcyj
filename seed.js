require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@vercel/kv');

// إعداد الاتصال بقاعدة بياناتك في Vercel
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

function generateSecureCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
  let code = 'TQZ-';
  for (let i = 0; i < 3; i++) {
    let block = '';
    for (let j = 0; j < 4; j++) {
      block += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code += block + (i < 2 ? '-' : '');
  }
  return code;
}

async function seedCodes() {
  console.log("🚀 جاري بدء توليد ورفع الأكواد إلى Vercel KV...");
  const codesToGenerate = 100;
  const newCodes = [];

  for (let i = 0; i < codesToGenerate; i++) {
    const code = generateSecureCode();
    const kvKey = `code_${code}`;
    
    // رفع الكود لقاعدة البيانات (غير مستخدم، وبدون جهاز)
    await kv.set(kvKey, { plan: "premium", used: false, deviceId: null });
    newCodes.push(code);
    console.log(`✅ تم رفع الكود [${i + 1}/${codesToGenerate}]: ${code}`);
  }

  console.log("\n🎉 تمت العملية بنجاح! انسخ هذه الأكواد لتوزيعها للطلاب:");
  console.log(newCodes.join('\n'));
}

seedCodes().catch(console.error);
