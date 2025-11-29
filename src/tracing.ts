import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

// Configure the OTLP endpoint. The environment variable OTLP_ENDPOINT or OTEL_EXPORTER_OTLP_ENDPOINT
// takes precedence. The default is http://localhost:4319/v1/traces (as requested).
const endpoint = process.env.OTLP_ENDPOINT || process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4319/v1/traces';

const exporter = new OTLPTraceExporter({ url: endpoint });

const sdk = new NodeSDK({
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk
  .start()
  .then(() => console.info('OpenTelemetry SDK started — exporting to', endpoint))
  .catch((err) => console.error('Error starting OpenTelemetry SDK', err));

// Graceful shutdown on termination signals
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.info('OpenTelemetry SDK shutdown complete'))
    .catch((err) => console.error('OpenTelemetry SDK shutdown error', err))
    .finally(() => process.exit(0));
});

export default sdk;
