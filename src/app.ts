// Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
// This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
import express from 'express';
import bodyParser from 'body-parser';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import affiliatesRouter from './routes/affiliates';
import webhooksRouter from './routes/webhooks';
import shopifyRouter from './routes/shopify';
import { errorHandler } from './errorHandler';

const app = express();
// Capture the raw body buffer on the request object so we can verify Shopify webhooks
// which require HMAC validation against the raw POST body bytes.
app.use(bodyParser.json({
	verify: (req: any, _res, buf: Buffer) => {
		if (buf && buf.length) req.rawBody = buf;
	}
}));

app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/affiliates', affiliatesRouter);
app.use('/webhooks', webhooksRouter);
app.use('/shopify', shopifyRouter);

// fallback
app.get('/', (_req, res) => res.json({ ok: true, name: 'torqued-affiliates-backend' }));

app.use(errorHandler);

export default app;
