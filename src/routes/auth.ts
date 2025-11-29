import { Router } from 'express';
const router = Router();

// Placeholder routes — replace with real auth logic
router.post('/login', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username required' });
  // send demo token
  res.json({ token: 'demo-token-for-' + username });
});

export default router;
