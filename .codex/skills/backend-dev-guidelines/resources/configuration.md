# Configuration Management

Guide to managing application settings and environment variables using a centralized, type-safe pattern.

---

## Centralized Configuration (UnifiedConfig)

Never access `process.env` directly in your business logic. Instead, use a centralized configuration object.

### Benefits
- **Type Safety**: IDE autocompletion and compile-time checks for all settings.
- **Validation**: Ensure all required settings are present at startup.
- **Defaults**: Provide sensible default values for development.
- **Testability**: Easily mock configurations in unit tests.

---

## Pattern Implementation

### 1. Define the Interface
```typescript
// config/types.ts
export interface AppConfig {
    database: { host: string; port: number };
    server: { port: number };
    sentry: { dsn: string };
}
```

### 2. Load and Validate
```typescript
// config/index.ts
export const config: AppConfig = {
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
    },
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
    },
    sentry: {
        dsn: process.env.SENTRY_DSN || '',
    }
};

// Simple validation
if (!config.sentry.dsn) {
    console.warn('SENTRY_DSN is not set. Monitoring is disabled.');
}
```

---

## Secret Management

- **DO NOT commit secrets**: Keep `.env` or `config.ini` files in your `.gitignore`.
- **Environment Variables**: Use environment variables for production secrets.
- **Fallback**: Provide dummy values or meaningful warnings for local development.

---

## Related Files
- [SKILL.md](../SKILL.md) - Main guide
- [sentry-and-monitoring.md](sentry-and-monitoring.md) - Using config for DSN
- [architecture-overview.md](architecture-overview.md) - Overall project structure

