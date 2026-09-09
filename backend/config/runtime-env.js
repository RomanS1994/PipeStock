export function assertRuntimeEnv() {
  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !String(process.env[key] || '').trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
