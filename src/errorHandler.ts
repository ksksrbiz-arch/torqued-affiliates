// Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
// This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
}
