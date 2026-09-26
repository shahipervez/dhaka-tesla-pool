# Deployment notes

The project is designed so deployment is optional but reproducibility is not.

## Required deployment properties

- free/free-tier only;
- PostgreSQL-compatible database;
- API receives `DATABASE_URL`, `JWT_SECRET`, and `WEB_ORIGIN`;
- frontend proxies `/api` to the API or sets `VITE_API_URL`;
- migrations run before the API starts;
- never copy `.env` secrets into Git.

## Simplest container deployment

Any provider that accepts Docker/Compose can run the repository. If Compose is not supported, deploy:

1. PostgreSQL;
2. `apps/api` using its Dockerfile;
3. `apps/web` using its Dockerfile.

API environment:

```text
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://...
JWT_SECRET=<long random value>
WEB_ORIGIN=https://<frontend-host>
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
```

Build-time frontend variable:

```text
VITE_API_URL=https://<api-host>/api
```

If frontend and API share one origin through a reverse proxy, use `/api`.

## Verification checklist

- `/health` returns `{"status":"ok"}`;
- login works with Jashim and Nusrat;
- Nusrat + Rafiq enter one pool;
- driver status transitions reflect on passenger screen;
- fourth seat attempt cannot push occupancy over capacity;
- refresh/restart does not lose DB data;
- no secrets appear in the public repository.

Free hosting plans change frequently. If a suitable free backend is unavailable at submission time, keep this Docker deployment reproducible and state the hosting limitation clearly rather than paying for infrastructure.

### Cookie topology

The easiest deployment is a **single public origin** where the frontend reverse-proxies `/api`; keep `COOKIE_SAMESITE=lax`.
If the frontend and API are on different sites, set `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none`, keep `WEB_ORIGIN` exact, and verify the hosting platform allows credentialed cross-origin cookies.
