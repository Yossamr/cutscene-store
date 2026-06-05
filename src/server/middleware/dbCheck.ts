import { Request, Response, NextFunction } from "express";
import { isDbReady } from "../db";

export const checkDbConnection = (req: Request, res: Response, next: NextFunction) => {
  if (!isDbReady) {
    return res.status(503).json({
      message: "Database is initializing. Please wait a moment and refresh.",
      status: "error"
    });
  }
  next();
};
