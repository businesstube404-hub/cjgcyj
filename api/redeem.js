const { kv } = require('@vercel/kv');

export default async function handler(req, res) {
  // نقبل فقط طلبات POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'غير مسموح بهذه الطريقة' });
  }

  const { code, deviceId } = req.body;

  if (!code || !deviceId) {
    return res.status(400).json({ success: false, message: 'الكود ومعرف الجهاز مطلوبان' });
  }

  try {
    // تجهيز مفتاح البحث في قاعدة البيانات
    const kvKey = `code_${code.trim().toUpperCase()}`;
    
    // جلب بيانات الكود من Vercel KV
    const codeData = await kv.get(kvKey);

    // إذا الكود غير موجود أصلاً
    if (!codeData) {
      return res.status(404).json({ success: false, message: 'الكود غير صحيح أو غير موجود' });
    }

    // إذا الكود جديد ولم يُستخدم بعد
    if (codeData.used === false) {
      const updatedData = {
        ...codeData,
        used: true,
        deviceId: deviceId // ربط الكود بجهاز الطالب
      };
      
      await kv.set(kvKey, updatedData);
      return res.status(200).json({ success: true, plan: updatedData.plan });
    } 
    // إذا الكود مستخدم مسبقاً
    else {
      if (codeData.deviceId === deviceId) {
        // الطالب رجع يفتح من نفس جهازه (نجاح)
        return res.status(200).json({ success: true, plan: codeData.plan });
      } else {
        // شخص آخر يحاول استخدام كود مسروق أو مستخدم (رفض)
        return res.status(403).json({ success: false, message: 'هذا الكود مستخدم مسبقاً على جهاز آخر' });
      }
    }
  } catch (error) {
    console.error("KV Error:", error);
    return res.status(500).json({ success: false, message: 'حدث خطأ في الخادم، تأكد من إعدادات Vercel KV' });
  }
}
