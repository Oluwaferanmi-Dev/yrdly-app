
# Maintenance Mode

To temporarily show a downtime screen for all routes:

1. Set `MAINTENANCE_MODE=true` in your environment (e.g., `.env.local`).
2. Start or restart the app. All routes will be rewritten to `\`/maintenance\``.
3. Set `MAINTENANCE_MODE=false` (or remove it) to disable maintenance mode.

Notes:
- Static assets like `/_next/*`, `/favicon.ico`, and the maintenance page itself remain accessible.
- The maintenance page component is at `src/app/maintenance/page.tsx`.

