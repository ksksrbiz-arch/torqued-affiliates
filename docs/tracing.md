# Copyright (c) 2025 Keith John Skaggs Jr. All rights reserved.
# This software is proprietary, copywritten, and strictly licensed. Unauthorized use is prohibited and will be prosecuted.
# Tracing / OpenTelemetry — quick start

This project includes an OpenTelemetry SDK initializer (`src/tracing.ts`) that will automatically instrument the Node.js runtime and export traces to an OTLP endpoint.

Default endpoint used by the SDK when not configured:

  http://localhost:4319/v1/traces

Set environment variable `OTLP_ENDPOINT` or `OTEL_EXPORTER_OTLP_ENDPOINT` to change target.

Example: run OpenTelemetry Collector locally using Docker (basic example)

```pwsh
# pull and run a collector that exports to console/jaeger for quick local testing
docker run --rm -p 4319:4319 -p 4318:4318 -p 16686:16686 -v $(pwd)/otel-config.yaml:/otel-local-config.yaml otel/opentelemetry-collector-contrib:latest --config=/otel-local-config.yaml
```

A very small `otel-config.yaml` you can use for local dev (export to console + Jaeger UI):

```yaml
receivers:
  otlp:
    protocols:
      http:
      grpc:

exporters:
  logging:
    loglevel: debug
  jaeger:
    endpoint: "http://jaeger:14268/api/traces"

service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [logging]
```

Tips
- The tracing initializer is imported by `src/index.ts` so no special start command is required in development. Make sure `OTLP_ENDPOINT` or `OTEL_EXPORTER_OTLP_ENDPOINT` points to the local collector URL if needed.
- For production use, consider using hosted tracing solutions or a collector for batching and replay.
- When validating Shopify webhooks you may need to preserve the raw request body for signature verification — ensure that instrumentation does not interfere with raw-body access.
