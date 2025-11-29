import { Router } from 'express';

const router = Router();

// GET /affiliates — list or search affiliates (stub)
router.get('/', (_req, res) => {
  res.json({ affiliates: [] });
});

// POST /affiliates/track — record a conversion/visit
router.post('/track', (req, res) => {
  const payload = req.body;
  // TODO: validate and persist
  res.status(201).json({ ok: true, payload });
});

export default router;
