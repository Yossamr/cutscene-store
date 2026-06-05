import { db } from "../db";

export async function sendTelegramNotification(message: string, phone?: string, retries = 3) {
  try {
    // Fetch telegram settings from DB
    const result = await db.execute("SELECT value FROM settings WHERE key = 'telegram_config'");
    
    let token = process.env.TELEGRAM_BOT_TOKEN || "7719448492:AAGqzuFAFrGJHcqYA7BVYTALgU6le4ua_YQ";
    let chatId = process.env.TELEGRAM_CHAT_ID;

    if (result.rows.length > 0) {
      const config = JSON.parse(result.rows[0].value as string);
      if (config.token) token = config.token;
      if (config.chatId) chatId = config.chatId;
    }

    if (!token || !chatId) {
      console.warn("⚠️ Telegram notification skipped: Token or Chat ID missing.");
      return;
    }

    const inline_keyboard: any[] = [
      [
        {
          text: "🚀 فتح لوحة التحكم",
          url: "https://yossamr.github.io/cutscene-store/admin"
        }
      ],
      [
        {
          text: "⚙️ دخول الأدمن (Browser)",
          url: "https://yossamr.github.io/cutscene-store/admin"
        }
      ]
    ];

    if (phone) {
      const formattedPhone = phone.startsWith('0') ? phone.substring(1) : phone;
      inline_keyboard.push([
        {
          text: "💬 التواصل مع العميل (واتساب)",
          url: `https://wa.me/20${formattedPhone}`
        }
      ]);
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    
    let attempt = 0;
    while (attempt < retries) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard
            }
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const delay = retryAfter ? parseInt(retryAfter) * 1000 : (attempt + 1) * 2000;
            console.warn(`⚠️ Telegram rate limited. Retrying after ${delay}ms... (Attempt ${attempt + 1}/${retries})`);
            await new Promise(res => setTimeout(res, delay));
            attempt++;
            continue;
          } else if (response.status === 400) {
            const errorText = await response.text();
            console.error(`❌ Telegram 400 Error (Formatting?):`, errorText);
            console.error(`❌ Message that caused error (Length: ${message.length}):`, message);
            // Fallback: Try plain text without HTML formatting if HTML fails
            console.log("🔄 Attempting fallback: Plain text message...");
            const plainMessage = message.replace(/<[^>]*>/g, '').trim(); 
            const fallbackRes = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: `⚠️ [خطأ في التنسيق] ⚠️\n\n${plainMessage}`,
                reply_markup: {
                  inline_keyboard
                }
              }),
            });
            
            if (fallbackRes.ok) {
              console.log("✅ Telegram fallback notification sent successfully.");
              return;
            }
            throw new Error(`Telegram API Fallback Error: ${fallbackRes.status}`);
          } else {
              const error = await response.text();
              console.error(`❌ Telegram API Error (${response.status}):`, error);
              throw new Error(`Telegram API Error: ${response.status}`);
          }
        } else {
          console.log("✅ Telegram notification sent successfully.");
          return;
        }
      } catch (err: any) {
        if (err.message?.includes('429')) {
          attempt++;
          continue;
        }
        throw err;
      }
    }
    throw new Error("Telegram notification failed after all retries.");
  } catch (error) {
    console.error("❌ Failed to send Telegram notification:", error);
    throw error;
  }
}
