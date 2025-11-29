# Dev Docker Compose

Bring up a full local development environment (app, Postgres, MongoDB, OTEL collector, Jaeger UI):

```pwsh
# start services
npm run docker:up

# stop
npm run docker:down
```

Notes
- The app runs in the Node container and mounts the current workspace so live reload works.
- Environment variables are copied from the host; ensure `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` are set in your environment before starting the app container.
- Traces are exported to the OTLP collector at `http://otel-collector:4319` and forwarded to Jaeger. Visit `http://localhost:16686` to view traces.
- By default the compose file starts Postgres and Mongo. You can change `DATABASE_TYPE` in the `.env` or as environment variables to `postgres`, `mongo`, or `memory` for local testing.
