// Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
// This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
import { Router } from 'express';
const router = Router();

router.get('/', (_req, res) => res.json({ uptime: process.uptime(), status: 'ok' }));

export default router;
