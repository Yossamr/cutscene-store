import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only";

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: any;
}

export const verifyTicket = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Get token from header
  const token = req.header("Authorization")?.replace("Bearer ", "");

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: "No VIP Ticket found, authorization denied." });
  }

  try {
    // Validating the VIP Ticket (JWT)
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "VIP Ticket is invalid or expired." });
  }
};

export const optionalVerifyTicket = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Get token from header
  const token = req.header("Authorization")?.replace("Bearer ", "");

  // Check if no token
  if (!token) {
    return next();
  }

  try {
    // Validating the VIP Ticket (JWT)
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // If token is invalid, we can still proceed as guest, or we can reject.
    // Let's proceed as guest.
    next();
  }
};
