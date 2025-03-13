// src/sentry.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// Get environment from window if available, or use 'production' as fallback
const environment = (window as any).__ENV__ || 'production';


// Initialize Sentry
Sentry.init({
    dsn: "https://bc51cb42da2cd07169c7aa8c459f07bf@o4508958212685824.ingest.us.sentry.io/4508958261248000",
    tracesSampleRate: 1.0, // Capture 100% of transactions
    attachStacktrace: true, // Capture code context
    release: "your-app-version", // Your app version
    environment: process.env.NODE_ENV,
    maxBreadcrumbs: 50,
});

//integrations: [new BrowserTracing()],
// Export the ErrorBoundary component for use in App.tsx
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Export the Sentry instance for manual error capturing if needed
export default Sentry;

