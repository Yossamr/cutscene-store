import { Request, Response } from "express";
import { db } from "../db";
import crypto from "crypto";

export const trackEvent = async (req: Request, res: Response) => {
  try {
    console.log("Analytics request body:", req.body);
    const { eventType, targetId, userId } = req.body;
    
    if (!eventType) {
      console.warn("Analytics tracking failed: eventType is missing", req.body);
      return res.status(400).json({ message: "Event type is required" });
    }

    const id = crypto.randomUUID();
    await db.execute({
      sql: "INSERT INTO analytics_events (id, event_type, target_id, user_id) VALUES (?, ?, ?, ?)",
      args: [id, eventType, targetId || null, userId || null],
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Error tracking event:", error);
    res.status(500).json({ message: "Failed to track event" });
  }
};
