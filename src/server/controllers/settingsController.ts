import { Request, Response } from "express";
import { db } from "../db";

export const getSettings = async (req: Request, res: Response) => {
  try {
    const result = await db.execute("SELECT key, value FROM settings");
    const settings: Record<string, any> = {};
    
    result.rows.forEach((row) => {
      try {
        settings[row.key as string] = JSON.parse(row.value as string);
      } catch (e) {
        settings[row.key as string] = row.value;
      }
    });
    
    res.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const updates = req.body; // Expecting { announcement: {...}, hero: {...} }
    
    for (const [key, value] of Object.entries(updates)) {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      await db.execute({
        sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
        args: [key, stringValue]
      });
    }
    
    res.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
};

export const testTelegram = async (req: Request, res: Response) => {
  try {
    const { token, chatId } = req.body;
    
    if (!token || !chatId) {
      return res.status(400).json({ error: "Token and Chat ID are required" });
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: "<b>🎬 Cutscene Store Notification Test</b>\n\nYour Telegram bot is now connected to the Director's Cut! 🎥\n\nYou will receive notifications here for every new order.",
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(400).json({ error: `Telegram API Error: ${error}` });
    }

    // Auto-save to database on successful test to ensure it's not lost
    await db.execute({
      sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
      args: ['telegram_config', JSON.stringify({ token, chatId })]
    });

    res.json({ success: true, message: "Test notification sent successfully and settings saved" });
  } catch (error) {
    console.error("Error testing Telegram:", error);
    res.status(500).json({ error: "Failed to send test notification" });
  }
};
