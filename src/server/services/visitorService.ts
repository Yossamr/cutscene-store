import { db } from "../db";
import { sendTelegramNotification } from "./telegramService";
import crypto from "crypto";

let isReporting = false;

export const trackVisitor = async (ip: string) => {
  try {
    // Log the visit (using user_id to store IP temporarily for unique counting)
    await db.execute({
      sql: "INSERT INTO analytics_events (id, event_type, user_id) VALUES (?, ?, ?)",
      args: [crypto.randomUUID(), 'page_view', ip]
    });

    // Check if we need to send a report
    await checkAndSendReport();
  } catch (error) {
    console.error("Error tracking visitor:", error);
  }
};

export const checkAndSendReport = async () => {
  if (isReporting) return;
  isReporting = true;

  try {
    // Get last report time from settings
    const result = await db.execute("SELECT value FROM settings WHERE key = 'last_visitor_report_time'");
    let lastReportTime = 0;
    if (result.rows.length > 0) {
      lastReportTime = parseInt(result.rows[0].value as string, 10);
    }

    const now = Date.now();
    if (now - lastReportTime >= 3600000) { // 1 hour
      // Get unique visitors in the last hour
      const countResult = await db.execute("SELECT COUNT(DISTINCT user_id) as count FROM analytics_events WHERE event_type = 'page_view' AND created_at >= datetime('now', '-1 hour')");
      const count = countResult.rows[0]?.count || 0;

      const message = count > 0 
        ? `
<b>📊 Store Traffic Report</b>
<b>Active Visitors (Last Hour):</b> ${count} 👥

<i>Keep the cameras rolling! 🎥</i>
        `
        : `
<b>📊 Store Traffic Report</b>
<b>Active Visitors (Last Hour):</b> 0 👥

<i>Quiet on the set... 🎬</i>
        `;

      await sendTelegramNotification(message);

      // Update last report time
      await db.execute({
        sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
        args: ['last_visitor_report_time', now.toString()]
      });

      // Cleanup old logs to save DB space (keep last 24 hours)
      await db.execute("DELETE FROM analytics_events WHERE event_type = 'page_view' AND created_at < datetime('now', '-24 hour')");
    }
  } catch (error) {
    console.error("Failed to check/send visitor report:", error);
  } finally {
    isReporting = false;
  }
};

export const startVisitorReporting = () => {
  // Check every minute just in case the server stays awake without new traffic
  setInterval(() => {
    checkAndSendReport();
  }, 60000);
};

export const forceSendVisitorReport = async () => {
  const countResult = await db.execute("SELECT COUNT(DISTINCT user_id) as count FROM analytics_events WHERE event_type = 'page_view' AND created_at >= datetime('now', '-1 hour')");
  const count = countResult.rows[0]?.count || 0;

  const message = `
<b>📊 Store Traffic Report (Forced)</b>
<b>Active Visitors (Last Hour):</b> ${count} 👥

<i>Keep the cameras rolling! 🎥</i>
  `;

  await sendTelegramNotification(message);
  
  await db.execute({
    sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
    args: ['last_visitor_report_time', Date.now().toString()]
  });
};
